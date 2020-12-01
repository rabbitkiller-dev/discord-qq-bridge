import {Client, MessageAttachment, WebhookMessageOptions} from "discord.js";
import {App, CQCode, RawSession} from 'koishi';
import config from "./koishi.config";
import axios from "axios";
import * as md5 from "md5";
import * as log from "./utils/log5";

const {sysLog} = require('./utils/sysLog'); // sysLog 保存日志
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
        // 把cq消息解码成对象
        let messageContent = msg.message;
        // 处理回复
        messageContent = await handlerReply(messageContent);
        // 处理at
        messageContent = await handlerAt(messageContent, msg);
        const cqMessages = CQCode.parseAll(messageContent);
        // 获取webhook
        const webhook = await discord.fetchWebhook(bridge.discord.id, bridge.discord.token);
        for (const cqMsg of cqMessages) {
            const option: WebhookMessageOptions = {
                username: `${msg.sender.card || msg.sender.nickname} (${msg.sender.userId})`,
                avatarURL: `http://q1.qlogo.cn/g?b=qq&nk=${msg.sender.userId}&s=100`
            }
            // 文字直接发送
            if (typeof cqMsg === 'string') {
                await webhook.send(cqMsg, option);
            } else {
                // 判断类型在发送对应格式
                switch (cqMsg.type) {
                    // 发送图片
                    case 'image': {
                        const attr = new MessageAttachment(cqMsg.data.url);
                        attr.setName('temp.png');
                        await webhook.send({
                            files: [attr],
                            ...option
                        });
                        break;
                    }
                    default: {
                        log.error(`不支持的消息: ${JSON.stringify(cqMsg)}`)
                        await webhook.send('[!不支持的消息]', option);
                    }
                }
            }
        }
        sysLog('⇿', 'QQ信息已推送到Discord', msg.sender.nickname, msg.message)
    });
}

function resolveBrackets(msg) {
    msg = msg.replace(new RegExp('&#91;', 'g'), '[').replace(new RegExp('&#93;', 'g'), ']')
    return msg
}

// 处理回复
async function handlerReply(message: string): Promise<string> {
    let cqMessages = CQCode.parseAll(message);
    if (cqMessages[0] && cqMessages[0]['type'] === 'reply') {
        const reply: any = cqMessages[0];
        const response = await axios.get(config.server + '/get_msg', {
            params: {
                message_id: reply.data.id
            }
        })
        const result = response.data;
        let replyMsg = ``;
        if (result.status === 'ok') {
            const replyTime = new Date(result.data.time * 1000);
            const replyDate = `${replyTime.getHours()}:${replyTime.getMinutes()}:${replyTime.getSeconds()}`;

            replyMsg = result.data.message
            replyMsg = resolveBrackets(replyMsg)
            replyMsg = replyMsg.split('\n').join('\n> ')
            replyMsg = '> ' + replyMsg + '\n'
            replyMsg = `> **__回复 ${result.data.sender.nickname} 在 ${replyDate} 的消息__**\n` + replyMsg
        }
        cqMessages.splice(0, 2);
        cqMessages = [replyMsg, ...cqMessages];
    }
    return CQCode.stringifyAll(cqMessages);
}

// 把表情解析成cq:image
async function handlerAt(message: string, ctx: RawSession<'message'>): Promise<string> {
    let cqMessages = CQCode.parseAll(message);
    cqMessages = await Promise.all(cqMessages.map(async (cqMsg) => {
        if (typeof cqMsg === 'string' || cqMsg.type !== 'at') {
            return cqMsg;
        }
        const user = await koishi.bots[0].getGroupMemberInfo(ctx.groupId, parseInt(cqMsg.data.qq));
        return `\`@${user.card || user.nickname}(${user.userId})\``
    }));
    return CQCode.stringifyAll(cqMessages);
}