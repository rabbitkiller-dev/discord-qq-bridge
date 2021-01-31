import {Client, Guild, Message, MessageAttachment, Webhook, WebhookMessageOptions} from "discord.js";
import {App, CQCode, RawSession, MessageInfo} from 'koishi';
import config from "../el.config";
import * as md5 from "md5";
import * as fs from "fs";
import * as path from "path";
import * as request from 'request';
import * as log from "../utils/log5";
import {GroupMemberInfo} from "koishi-adapter-cqhttp";
import {BridgeConfig} from "../interface";
import {DatabaseService} from "./database.service";
import {MessageEntity} from "./entity/message.entity";
import {createCanvas, loadImage} from "canvas";
import {downloadImage, imageCacheDir, imageDiscordAvatarCacheDir} from "./utils/download-file";
import {ElAndDiscordService} from "./elAndDiscord.service";

const {sysLog} = require('../utils/sysLog'); // sysLog 保存日志
export default async function () {
    ElAndDiscordService.discord.on('message', async (msg) => {
        if (msg.content === '!ping') {
            msg.channel.send('Pong.');
        }
        await toQQ(msg);
    });
}

// 转发到qq
export async function toQQ(msg: Message) {
    // 无视自己的消息
    if (msg.author.id === config.discordBot || (config.bridges.find(opt => opt.discord.id === msg.author.id))) {
        return;
    }
    // 查询这个频道是否需要通知到群
    const bridge: BridgeConfig = config.bridges.find((opt) => opt.discord.channelID === msg.channel.id);
    if (!bridge) {
        return;
    }
    try {
        const temps: any[] = [];
        // 添加用户名称在信息前面
        let messageContent = `[Discord] @${msg.author.username}#${msg.author.discriminator}`;
        // let messageContent = await handlerUserAvatar(msg.content, {msg: msg, bridge: bridge});
        // 没有内容时不处理
        if (msg.content.trim()) {
            messageContent = `${messageContent}\n${msg.content}`;
            // 处理回复
            messageContent = await parseEmoji(messageContent);
            // 处理回复
            messageContent = await handlerReply(messageContent, {msg: msg, bridge: bridge});
            messageContent = await handlerAt(messageContent, {msg: msg, bridge: bridge});
            messageContent = await handlerAtQQUser(messageContent, {msg: msg, bridge: bridge});
        }
        temps.push(messageContent);
        if (msg.attachments.size > 0) {
            const attachments = msg.attachments.array();
            for (let attachment of attachments) {
                temps.push(CQCode.stringify('image', {file: attachment.url}))
            }
        }
        const resMessage = await ElAndDiscordService.qqBot.mirai.api.sendGroupMessage(temps.join('\n'), bridge.qqGroup);
        // const msgID = await koishi.bots[0].sendGroupMsg(bridge.qqGroup, temps.join('\n'));
        // const qqMessage = await koishi.bots[0].getMsg(msgID)
        // await handlerSaveMessage(qqMessage, msg);
        log.message('⇿', 'Discord消息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
    } catch (error) {
        log.error(error);
        const resMessage = await ElAndDiscordService.qqBot.mirai.api.sendGroupMessage('发生错误导致消息同步失败', bridge.qqGroup);
        // const qqMessage = await koishi.bots[0].getMsg(msgID)
        // await handlerSaveMessage(qqMessage, msg);
    }
}

// 把表情解析成cq:image
export async function parseEmoji(message: string): Promise<string> {
    let content = message;
    // discord的表情图
    const res = message.match(/<:(\w+):(\d+)>/g);
    if (res && res.length > 0) {
        for (const emojiBlock of res) {
            const emojiMatch = emojiBlock.match(/^<:(\w+):(\d+)>/);
            if (emojiMatch[2]) {
                content = content.replace(emojiBlock, CQCode.stringify('image', {file: `https://cdn.discordapp.com/emojis/${emojiMatch[2]}.png`}));
            }
        }
    }

    // discord的gif图
    const gifMatches = content.match(/https:\/\/tenor\.com\/view\/([\w]+-)+[0-9]+/g);
    if (gifMatches && gifMatches.length > 0) {
        for (const gifUrl of gifMatches) {
            content = content.replace(gifUrl, CQCode.stringify('image', {file: `${gifUrl}.gif`}));
        }
    }
    return content;
}

// 处理头部消息
export async function handlerUserAvatar(message: string, ctx: { msg: Message, bridge: BridgeConfig }): Promise<string> {
    const filePath = await downloadImage({url: ctx.msg.author.avatarURL({format: 'png'})});
    const img = await loadImage(filePath);
    const canvas = createCanvas(30, 30)
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.arc(15, 15, 15, 0, Math.PI * 2, false)
    canvasCtx.clip()
    canvasCtx.drawImage(img, 0, 0, 30, 30);
    // const imgDataUrl = canvas.toDataURL();
    let stream = fs.createWriteStream(path.join(imageDiscordAvatarCacheDir, path.basename(filePath)));
    stream.write(canvas.toBuffer());
    const cqImage = CQCode.stringify('image', {file: 'file:///' + path.join(imageDiscordAvatarCacheDir, path.basename(filePath))});
    // const cqImage = CQCode.stringify('image', {file: imgDataUrl.replace('data:image/png;base64,', 'base64://')});
    // const cqImage = CQCode.stringify('image', {file: 'https://www.baidu.com/img/flexible/logo/pc/result.png'});
    return `${cqImage} @${ctx.msg.author.username}#${ctx.msg.author.discriminator}`;
    // return `[D] ${cqImage} @${ctx.msg.author.username}#${ctx.msg.author.discriminator}\n${message}`;
}

// 处理回复消息
export async function handlerReply(message: string, ctx: { msg: Message, bridge: BridgeConfig }): Promise<string> {
    if (ctx.msg.reference && ctx.msg.reference.messageID) {
        const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
        const refMsg = await messageRepo.findOne({discordMessageID: ctx.msg.reference.messageID});
        // 尝试查找discord对应的qq消息id
        if (refMsg) {
            const replyCQCODE = CQCode.stringify('reply', {id: refMsg.qqMessageID});
            return `${replyCQCODE}${message}`
        } else {
            // 找不到就证明是旧的消息或者某些原因找不到, 那就纯文本当回复吧
            const channel: any = await ElAndDiscordService.discord.channels.fetch(ctx.msg.channel.id);
            const replyMsg = await channel.messages.fetch(ctx.msg.reference.messageID);
            return `回复消息：${replyMsg.content}\n${message}`
        }
    }
    return message;
}

// 处理at消息
export async function handlerAt(message: string, ctx: { msg: Message, bridge: BridgeConfig }): Promise<string> {
    ctx.msg.mentions.users.forEach((user) => {
        message = message.replace(`<@${user.id}>`, `@${user.username}#${user.discriminator}`);
        message = message.replace(`<@!${user.id}>`, `@${user.username}#${user.discriminator}`);
    });
    return message;
}

// 处理at discord用户
export async function handlerAtQQUser(message: string, ctx: { msg: Message, bridge: BridgeConfig }): Promise<string> {
    const atList: Array<{ username: string, qq?: string, origin: string }> = [];
    // 正则匹配
    const m1 = message.match(/\@([^\n]+) (?:\()([0-9]+)\)(\#0000)?/g);
    if (m1) {
        m1.forEach((m) => {
            atList.push({
                origin: m,
                username: m.match(/\@([^\n]+) (?:\()([0-9]+)\)(\#0000)?/)[1],
                qq: m.match(/\@([^\n]+) (?:\()([0-9]+)\)(\#0000)?/)[2]
            })
        })
    }
    // 正则匹配
    const m2 = message.match(/\@([^\n]+)(?:\()([0-9]+)\)(\#0000)?/g);
    if (m2) {
        m2.forEach((m) => {
            atList.push({
                origin: m,
                username: m.match(/\@([^\n]+)(?:\()([0-9]+)\)(\#0000)?/)[1],
                qq: m.match(/\@([^\n]+)(?:\()([0-9]+)\)(\#0000)?/)[2]
            })
        })
    }
    [
        /\[@([\w-_\s]+)\]/, // [@rabbitkiller]
        /`@([\w-_\s]+)`/, // `@rabbitkiller`
    ].forEach((reg) => {
        const gReg = new RegExp(reg.source, 'g');
        const sReg = new RegExp(reg.source);
        // 全局匹配满足条件的
        const strList = message.match(gReg);
        if (!strList) {
            return;
        }
        strList.forEach((str) => {
            // 获取用户名, 保留origin匹配上的字段用来replace
            if (str.match(sReg)[1]) {
                atList.push(
                    {origin: str, username: str.match(sReg)[1].trim()}
                )
            }
        })
    });
    if (atList.length === 0) {
        return message;
    }
    // @ts-ignore
    /*const fetchedMembers: GroupMemberInfo[] = await koishi.bots[0].getGroupMemberList(ctx.bridge.qqGroup);
    fetchedMembers.forEach((member) => {
        // 匹配用户名
        const ats = atList.filter(at => {
            if (at.qq && parseInt(at.qq) === member.userId) {
                return true;
            } else if (at.qq) {
                return false;
            }
            return at.username === member.card || at.username === member.nickname;
        });
        if (ats.length === 0) {
            return;
        }
        // 替换
        ats.forEach((at) => {
            message = message.replace(at.origin, CQCode.stringify('at', {qq: member.userId}))
        })
    });*/
    return message;
}

// 保存关联消息
async function handlerSaveMessage(qqMessage: MessageInfo, discordMessage: Message): Promise<MessageEntity> {
    const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
    const messageEntity = new MessageEntity();
    messageEntity.from = "discord";
    messageEntity.qqMessageID = qqMessage.messageId.toString();
    messageEntity.qqMessage = {
        content: qqMessage.message
    }
    messageEntity.discordMessageID = discordMessage.id;
    messageEntity.discordMessage = {
        content: discordMessage.content,
        attachments: discordMessage.attachments.array() as any,
    }
    return messageRepo.save(messageEntity);
}
