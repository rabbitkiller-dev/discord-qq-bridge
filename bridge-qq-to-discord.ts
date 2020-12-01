import {Client, MessageAttachment, WebhookMessageOptions} from "discord.js";
import {App, CQCode} from 'koishi';
import config from "./koishi.config";
import * as md5 from "md5";
import * as log from "./utils/log5";

const {sysLog} = require('./utils/sysLog'); // sysLog 保存日志

export default async function (ctx: {
    discord: Client,
    koishi: App
}) {
    const {koishi, discord} = ctx;
    koishi.group(...config.bridges.map(b => b.qqGroup)).on('message', async (msg) => {
        // 查看有没有连接配置
        const bridge = config.bridges.find((bridge) => bridge.qqGroup === msg.groupId);
        if (!bridge) {
            return;
        }
        // 把cq消息解码成对象
        const cqMessages = CQCode.parseAll(msg.message);
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