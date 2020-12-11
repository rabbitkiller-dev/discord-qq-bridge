import {Client, Guild, MessageAttachment, Webhook, WebhookMessageOptions} from "discord.js";
import {App, CQCode, RawSession} from 'koishi';
import config from "../koishi.config";
import axios from "axios";
import * as md5 from "md5";
import * as log from "../utils/log5";
import {CqHttpApi} from "../utils/cqhttp.api";
import {DatabaseService} from "./database.service";
import {MessageEntity} from "./entity/message.entity";

const {sysLog} = require('../utils/sysLog'); // sysLog 保存日志
let discord: Client;
let koishi: App
export default async function (ctx: {
    discord: Client,
    koishi: App
}) {
    koishi = ctx.koishi;
    discord = ctx.discord;
    koishi.group(...config.bridges.map(b => b.qqGroup)).on('message', async (msg) => {
        // 查看有没有连接配置
        const bridge = config.bridges.find((bridge) => bridge.qqGroup === msg.groupId);
        if (!bridge) {
            return;
        }
        // 获取webhook
        const webhook = await discord.fetchWebhook(bridge.discord.id, bridge.discord.token);

        log.message(`[QQ Start] ------------------QQ-----------------------`);
        log.message(`[author.id=${msg.userId}] [group.id=${msg.groupId}] [username=${msg.sender.card || msg.sender.nickname}]`);
        log.message(`[content=${msg.message}]`);
        log.message(`[QQ End]`);

        // 把cq消息解码成对象
        let messageContent = msg.message;
        // 处理回复
        messageContent = await handlerReply(messageContent);
        // 处理at discord用户
        messageContent = await handlerAtDiscordUser(messageContent, {msg: msg, webhook: webhook});
        // 处理at
        messageContent = await handlerAt(messageContent, {msg: msg, webhook: webhook});
        const cqMessages = CQCode.parseAll(messageContent);
        for (const cqMsg of cqMessages) {
            const option: WebhookMessageOptions = {
                username: `${msg.sender.card || msg.sender.nickname}(${msg.sender.userId})`,
                avatarURL: `http://q1.qlogo.cn/g?b=qq&nk=${msg.sender.userId}&s=100`
            }
            // 文字直接发送
            if (typeof cqMsg === 'string') {
                const resMessage = await webhook.send(cqMsg, option);
                if (Array.isArray(resMessage)) {
                    await handlerSaveMessage(msg.messageId.toString(), resMessage[0].id);
                } else {
                    await handlerSaveMessage(msg.messageId.toString(), resMessage.id);
                }
            } else {
                // 判断类型在发送对应格式
                switch (cqMsg.type) {
                    // 发送图片
                    case 'image': {
                        const image = await CqHttpApi.getImage(cqMsg.data.file);
                        const attr = new MessageAttachment(cqMsg.data.url);
                        attr.setName(image.filename.replace(/(\.null)|(\.image)/g, '.png'));
                        const resMessage = await webhook.send({
                            files: [attr],
                            ...option
                        });
                        if (Array.isArray(resMessage)) {
                            await handlerSaveMessage(msg.messageId.toString(), resMessage[0].id);
                        } else {
                            await handlerSaveMessage(msg.messageId.toString(), resMessage.id);
                        }
                        break;
                    }
                    case 'face': {
                        const attr = new MessageAttachment(`https://res.wx.qq.com/mpres/htmledition/images/icon/emotion/${cqMsg.data.id}.gif`);
                        attr.setName(`${cqMsg.data.id}.gif`);
                        const resMessage = await webhook.send({
                            files: [attr],
                            ...option
                        });
                        if (Array.isArray(resMessage)) {
                            await handlerSaveMessage(msg.messageId.toString(), resMessage[0].id);
                        } else {
                            await handlerSaveMessage(msg.messageId.toString(), resMessage.id);
                        }
                        break;
                    }
                    default: {
                        log.error(`没有处理过的消息: ${JSON.stringify(cqMsg)}`)
                        const resMessage = await webhook.send(CQCode.stringify(cqMsg.type, cqMsg.data), option);
                        if (Array.isArray(resMessage)) {
                            await handlerSaveMessage(msg.messageId.toString(), resMessage[0].id);
                        } else {
                            await handlerSaveMessage(msg.messageId.toString(), resMessage.id);
                        }
                    }
                }
            }
        }
        sysLog('⇿', 'QQ消息已推送到Discord', msg.sender.nickname, msg.message)
    });
}

function resolveBrackets(msg) {
    msg = msg.replace(new RegExp('&#91;', 'g'), '[').replace(new RegExp('&#93;', 'g'), ']')
    return msg
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
                if (!mlist) {
                    return;
                }
                const [m1, m2, m3] = mlist;
                replyMsg = replyMsg.replace(m1, `@${m2}#${m3}`);
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
        /&#91;at:([\w-_\s]+)#(\d+)&#93;/, // [at:rabbitkiller#7372]
        /&#91;@([\w-_\s]+)#(\d+)&#93;/, // [@rabbitkiller#7372]
        /`at:([\w-_\s]+)#(\d+)`/, // `at:rabbitkiller#7372`
        /`@([\w-_\s]+)#(\d+)`/, // `@rabbitkiller#7372`
        /at:([\w-_\s]+)#(\d+)/, // at:rabbitkiller#7372
        /@([\w-_\s]+)#(\d+)/, // @rabbitkiller#7372
        // 不需要#号的
        /&#91;at:([\w-_\s]+)&#93;/, // [at:rabbitkiller]
        /&#91;@([\w-_\s]+)&#93;/, // [@rabbitkiller]
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
async function handlerSaveMessage(qqMessageID: string, discordMessageID: string): Promise<MessageEntity> {
    const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
    return messageRepo.save({
        qqMessageID,
        discordMessageID,
        from: 'qq',
    });
}