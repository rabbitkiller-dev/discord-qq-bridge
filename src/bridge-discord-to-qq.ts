import {Client, Guild, Message, MessageAttachment, Webhook, WebhookMessageOptions} from "discord.js";
import {App, CQCode, RawSession} from 'koishi';
import config from "../koishi.config";
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

const {sysLog} = require('../utils/sysLog'); // sysLog 保存日志
let discord: Client;
let koishi: App;
export default async function (ctx: {
    discord: Client,
    koishi: App
}) {
    koishi = ctx.koishi;
    discord = ctx.discord;
    discord.on('message', async (msg) => {
        if (msg.content === '!ping') {
            msg.channel.send('Pong.');
        }
        log.message(`[Discord Start] -----------------------------------------`);
        log.message(`[author.id=${msg.author.id}] [channel.id=${msg.channel.id}] [username=${msg.author.username + '#' + msg.author.discriminator}]`);
        log.message(`[content=${msg.content}]`);
        log.message(`[Discord End]`);
        await toQQ(msg);
    });
}

// 转发到qq
export async function toQQ(msg) {
    // 无视自己的消息
    if (msg.author.id === config.discordBot || (config.bridges.find(opt => opt.discord.id === msg.author.id))) {
        return;
    }
    // 查询这个频道是否需要通知到群
    const bridge: BridgeConfig = config.bridges.find((opt) => opt.discord.channelID === msg.channel.id);
    try {
        if (!bridge) {
            return;
        }
        const temps: any[] = [];
        // 没有内容时不处理
        if (msg.content.trim()) {
            // 添加用户名称在信息前面
            let messageContent = `[Discord] @${msg.author.username}#${msg.author.discriminator}\n${msg.content}`;
            // 处理回复
            messageContent = await parseEmoji(messageContent);
            // 处理回复
            messageContent = await handlerReply(messageContent, {msg: msg, bridge: bridge});
            messageContent = await handlerAt(messageContent, {msg: msg, bridge: bridge});
            messageContent = await handlerAtQQUser(messageContent, {msg: msg, bridge: bridge});
            temps.push(messageContent);
        }
        if (msg.attachments.size > 0) {
            const attachments = msg.attachments.array();
            for (let attachment of attachments) {
                temps.push(CQCode.stringify('image', {file: attachment.url}))
            }
        }
        if (temps.length > 0) {
            koishi.bots[0].sendGroupMsg(bridge.qqGroup, temps.join('\n')).then((msgID) => {
                handlerSaveMessage(msgID.toString(), msg.id);
                sysLog('⇿', 'Discord消息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
            });
        } else {
            temps.push('不支持该消息');
            koishi.bots[0].sendGroupMsg(bridge.qqGroup, temps.join('\n')).then((msgID) => {
                handlerSaveMessage(msgID.toString(), msg.id);
                sysLog('⇿', 'Discord消息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
            });
        }
    } catch (error) {
        log.error(error);
        koishi.bots[0].sendGroupMsg(bridge.qqGroup, '发生错误导致消息同步失败').then((msgID) => {
            handlerSaveMessage(msgID.toString(), msg.id);
        });
    }
}

// 把表情解析成cq:image
export async function parseEmoji(message: string): Promise<string> {
    let content = message;
    const res = message.match(/<:(\w+):(\d+)>/g);
    if (!res || res.length === 0) {
        return content;
    }
    for (const emojiBlock of res) {
        const emojiMatch = emojiBlock.match(/^<:(\w+):(\d+)>/);
        if (emojiMatch[2]) {
            content = content.replace(emojiBlock, CQCode.stringify('image', {file: `https://cdn.discordapp.com/emojis/${emojiMatch[2]}.png`}));
        }
    }
    return content;
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
            const channel: any = await discord.channels.fetch(ctx.msg.channel.id);
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
        /\[at:([\w-_\s]+)\]/, // [at:rabbitkiller]
        /\[@([\w-_\s]+)\]/, // [@rabbitkiller]
        /`at:([\w-_\s]+)`/, // `at:rabbitkiller`
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
    const fetchedMembers: GroupMemberInfo[] = await koishi.bots[0].getGroupMemberList(ctx.bridge.qqGroup);
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
    });
    return message;
}

// 保存关联消息
async function handlerSaveMessage(qqMessageID: string, discordMessageID: string): Promise<MessageEntity> {
    const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
    return messageRepo.save({
        qqMessageID,
        discordMessageID,
        from: 'discord',
    });
}
