import {Client, Guild, Message, MessageAttachment, Webhook, WebhookMessageOptions} from "discord.js";
import {App, CQCode, RawSession} from 'koishi';
import config from "../koishi.config";
import axios from "axios";
import * as md5 from "md5";
import * as log from "../utils/log5";
import {CqHttpApi} from "../utils/cqhttp.api";
import {DatabaseService} from "./database.service";
import {MessageEntity} from "./entity/message.entity";
import {downloadImage, downloadQQImage} from "./utils/download-file";

const {sysLog} = require('../utils/sysLog'); // sysLog 保存日志
let discord: Client;
let koishi: App
export default async function (ctx: {
    discord: Client,
    koishi: App
}) {
    koishi = ctx.koishi;
    discord = ctx.discord;
    koishi.group(...config.bridges.map(b => b.qqGroup)).on('message', async (qqMessage) => {
        await toDiscord(qqMessage);
    });
}

async function toDiscord(qqMessage: RawSession<'message'>) {
    // 查看有没有连接配置
    const bridge = config.bridges.find((bridge) => bridge.qqGroup === qqMessage.groupId);
    if (!bridge) {
        return;
    }
    // 获取webhook
    const webhook = await discord.fetchWebhook(bridge.discord.id, bridge.discord.token);
    try {
        // 把cq消息解码成对象
        let messageContent = qqMessage.message;
        // 处理转发
        messageContent = await handlerForward(messageContent);
        // 处理回复
        messageContent = await handlerReply(messageContent);
        // 处理at discord用户
        messageContent = await handlerAtDiscordUser(messageContent, {msg: qqMessage, webhook: webhook});
        // 处理at
        messageContent = await handlerAt(messageContent, {msg: qqMessage, webhook: webhook});
        const cqMessages = CQCode.parseAll(messageContent);
        for (const cqMsg of cqMessages) {
            const option: WebhookMessageOptions = {
                username: `${qqMessage.sender.card || qqMessage.sender.nickname}(${qqMessage.sender.userId})`,
                avatarURL: `https://q1.qlogo.cn/g?b=qq&nk=${qqMessage.sender.userId}&s=100&t=${Math.random()}`
                // avatarURL: `https://q.qlogo.cn/g?b=qq&nk={uid}&s=100&t={Math.random()}
                // avatarURL: `http://q.qlogo.cn/headimg_dl?bs=qq&dst_uin=${qqMessage.sender.userId}&src_uin=www.feifeiboke.com&fid=blog&spec=640&t=${Math.random()}` // 高清地址
            }
            // 文字直接发送
            if (typeof cqMsg === 'string') {
                let strMsg = resolveBrackets(cqMsg);
                const resMessage: Message = await webhook.send(strMsg, option) as Message;
                await handlerSaveMessage(qqMessage, resMessage);
            } else {
                // 判断类型在发送对应格式
                switch (cqMsg.type) {
                    // 发送图片
                    case 'image': {
                        const filePath = await downloadQQImage({url: cqMsg.data.url});
                        const attr = new MessageAttachment(filePath);
                        const resMessage = await webhook.send({
                            files: [attr],
                            ...option
                        }) as Message;
                        await handlerSaveMessage(qqMessage, resMessage);
                        break;
                    }
                    case 'face': {
                        const attr = new MessageAttachment(`https://res.wx.qq.com/mpres/htmledition/images/icon/emotion/${cqMsg.data.id}.gif`);
                        attr.setName(`${cqMsg.data.id}.gif`);
                        const resMessage = await webhook.send({
                            files: [attr],
                            ...option
                        }) as Message;
                        await handlerSaveMessage(qqMessage, resMessage);
                        break;
                    }
                    default: {
                        log.error(`没有处理过的消息: ${JSON.stringify(cqMsg)}`)
                        const resMessage = await webhook.send(CQCode.stringify(cqMsg.type, cqMsg.data), option) as Message;
                        await handlerSaveMessage(qqMessage, resMessage);
                    }
                }
            }
        }
        sysLog('⇿', 'QQ消息已推送到Discord', qqMessage.sender.nickname, qqMessage.message)
    } catch (error) {
        log.error(error);
        const resMessage = await webhook.send('发生错误导致消息同步失败') as Message;
        await handlerSaveMessage(qqMessage, resMessage);
    }
}


function resolveBrackets(msg) {
    msg = msg.replace(new RegExp('&#91;', 'g'), '[').replace(new RegExp('&#93;', 'g'), ']')
    return msg
}

// 处理转发
async function handlerForward(message: string): Promise<string> {
    let cqMessages = CQCode.parseAll(message);
    await Promise.all(cqMessages.map(async (cqMsg) => {
        if (typeof cqMsg === 'string' || cqMsg.type !== 'forward') {
            return cqMsg;
        }
        const response = await axios.get(config.server + '/get_msg', {
            params: {
                message_id: cqMsg.data.id
            }
        })
        const result = response.data;
        let forwardMsg = ``;
        if (result.status === 'ok') {
            const forwardTime = new Date(result.data.time * 1000);
            const forwardDate = `${forwardTime.getHours()}:${forwardTime.getMinutes()}:${forwardTime.getSeconds()}`;

            forwardMsg = result.data.message;
            forwardMsg = resolveBrackets(forwardMsg);
            // 回复的消息是否来自discord
            const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
            const refMsg = await messageRepo.findOne({qqMessageID: cqMsg.data.id});
            if (refMsg && refMsg.from === 'discord') {
                // 把来自discord的用户头像去掉
                const mlist = forwardMsg.match(/\[CQ:image,file=.*] @([\w-_\s]+)#(\d+)/);
                if (mlist) {
                    const [m1, m2, m3] = mlist;
                    forwardMsg = forwardMsg.replace(m1, `@${m2}#${m3}`);
                }
            }
            forwardMsg = forwardMsg.split('\n').join('> ');
            forwardMsg = '> ' + forwardMsg + '\n';
            forwardMsg = `> **__转发 @${result.data.sender.nickname} 在 ${forwardDate} 的消息__**\n` + forwardMsg;
            // 把回复消息里的图片换成点位符,
            forwardMsg = CQCode.stringifyAll(CQCode.parseAll(forwardMsg).map((cqMsg) => {
                if (typeof cqMsg === 'string') {
                    return cqMsg;
                }
                if (cqMsg.type === 'image' || cqMsg.type === 'face') {
                    return `:frame_photo:`;
                }
                return cqMsg;
            }));
        }
        cqMessages.splice(0, 2);
        cqMessages = [forwardMsg, ...cqMessages];
    }));
    return CQCode.stringifyAll(cqMessages);
}

// 处理回复
async function handlerReply(message: string): Promise<string> {
    let cqMessages = CQCode.parseAll(message);
    await Promise.all(cqMessages.map(async (cqMsg) => {
        if (typeof cqMsg === 'string' || cqMsg.type !== 'reply') {
            return cqMsg;
        }
        const response = await axios.get(config.server + '/get_msg', {
            params: {
                message_id: cqMsg.data.id
            }
        })
        const result = response.data;
        let replyMsg = ``;
        if (result.status === 'ok') {
            const replyTime = new Date(result.data.time * 1000);
            const replyDate = `${replyTime.getHours()}:${replyTime.getMinutes()}:${replyTime.getSeconds()}`;

            replyMsg = result.data.message;
            replyMsg = resolveBrackets(replyMsg);
            // 回复的消息是否来自discord
            const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
            const refMsg = await messageRepo.findOne({qqMessageID: cqMsg.data.id});
            if (refMsg && refMsg.from === 'discord') {
                // 把来自discord的用户头像去掉
                const mlist = replyMsg.match(/\[CQ:image,file=.*] @([\w-_\s]+)#(\d+)/);
                if (mlist) {
                    const [m1, m2, m3] = mlist;
                    replyMsg = replyMsg.replace(m1, `@${m2}#${m3}`);
                }
            }
            replyMsg = replyMsg.split('\n').join('\n> ');
            replyMsg = '> ' + replyMsg + '\n';
            replyMsg = `> **__回复 @${result.data.sender.nickname} 在 ${replyDate} 的消息__**\n` + replyMsg;
            // 把回复消息里的图片换成点位符,
            replyMsg = CQCode.stringifyAll(CQCode.parseAll(replyMsg).map((cqMsg) => {
                if (typeof cqMsg === 'string') {
                    // 当qq回复的消息里面也有回复时会出来一串不明物,也去掉变成空字符串
                    if (cqMsg.includes('<summary>点击查看完整消息</summary>') && cqMsg.includes('<source name="聊天记录"')) {
                        return '';
                    }
                    return cqMsg;
                }
                if (cqMsg.type === 'image' || cqMsg.type === 'face') {
                    return `:frame_photo:`;
                }
                if (cqMsg.type === 'reply') {
                    return '';
                }
                if (cqMsg.type === 'xml') {
                    return '';
                }
                return cqMsg;
            }));
        }
        cqMessages.splice(0, 2);
        cqMessages = [replyMsg, ...cqMessages];
    }));
    return CQCode.stringifyAll(cqMessages);
}

// 处理at消息
async function handlerAt(message: string, ctx: { msg: RawSession<'message'>, webhook: Webhook }): Promise<string> {
    let cqMessages = CQCode.parseAll(message);
    cqMessages = await Promise.all(cqMessages.map(async (cqMsg) => {
        if (typeof cqMsg === 'string' || cqMsg.type !== 'at') {
            return cqMsg;
        }
        if(cqMsg.data.qq === 'all'){
            return `\`@全休成员\``
        }
        // @ts-ignore
        const user = await koishi.bots[0].getGroupMemberInfo(ctx.msg.groupId, parseInt(cqMsg.data.qq));
        return `\`@${user.card || user.nickname}(${user.userId})\``
    }));
    return CQCode.stringifyAll(cqMessages);
}

// 处理at discord用户
async function handlerAtDiscordUser(message: string, ctx: { msg: RawSession<'message'>, webhook: Webhook }): Promise<string> {
    const atList: Array<{ username: string, discriminator: string, origin: string }> = [];
    // 正则匹配
    [
        /&#91;@([^\n#]+)#(\d\d\d\d)&#93;/, // [@rabbitkiller#7372]
        /`@([^\n#]+)#(\d\d\d\d)`/, // `@rabbitkiller#7372`
        /@([^\n#]+)#(\d\d\d\d)/, // @rabbitkiller#7372
        // 不需要#号的
        /&#91;@([^\n#]+)&#93;/, // [@rabbitkiller]
        /`@([^\n#]+)`/, // `@rabbitkiller`
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
                    {origin: str, username: str.match(sReg)[1].trim(), discriminator: str.match(sReg)[2]}
                )
            }
        })
    })
    if (atList.length === 0) {
        return message;
    }
    // 获取guild, 在通过guild获取所有用户
    const guild: Guild = await discord.guilds.fetch(ctx.webhook.guildID);
    const fetchedMembers = await guild.members.fetch();
    fetchedMembers.forEach((member) => {
        // 匹配用户名
        const ats = atList.filter(at => at.username === member.user.username);
        if (ats.length === 0) {
            return;
        }
        // 替换
        ats.forEach((at) => {
            message = message.replace(at.origin, `<@!${member.user.id}>`)
        })
    });
    return message;
}

// 保存关联消息
async function handlerSaveMessage(qqMessage: RawSession<'message'>, discordMessage: Message): Promise<MessageEntity> {
    const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
    const messageEntity = new MessageEntity();
    messageEntity.from = "qq";
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
