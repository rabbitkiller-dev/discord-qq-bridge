import {Client, Message, MessageAttachment, WebhookMessageOptions} from "discord.js";
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
    discord.on('message', async (msg) => {
        if (msg.content === '!ping') {
            msg.channel.send('Pong.');
        }
        log.message(`[Discord Start] `);
        log.message(`[author.id=${msg.author.id}] [channel.id=${msg.channel.id}] [username=${msg.author.username + '#' + msg.author.discriminator}]`);
        log.message(`[content=${msg.content}]`);
        log.message(`[Discord End]`);
        // 无视自己的消息
        if (msg.author.id === config.discordBot || (config.bridges.find(opt => opt.discord.id === msg.author.id))) {
            return;
        }
        // 查询这个频道是否需要通知到群
        const bridge = config.bridges.find((opt) => opt.discord.channelID === msg.channel.id);
        if (!bridge) {
            return;
        }
        const temps: any[] = [
            '[Discord] ' + msg.author.username + '#' + msg.author.discriminator
        ];
        // 没有内容时不处理
        if (msg.content.trim()) {
            temps.push(await parseEmoji(msg.content));
        }
        if (msg.attachments.size > 0) {
            const attachments = msg.attachments.array();
            for (let attachment of attachments) {
                temps.push(CQCode.stringify('image', {file: attachment.url}))
            }
        }
        if (temps.length > 1) {
            koishi.bots[0].sendGroupMsg(bridge.qqGroup, temps.join('\n')).then(() => {
                sysLog('⇿', 'Discord消息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
            });
        } else {
            temps.push('不支持该消息');
            koishi.bots[0].sendGroupMsg(bridge.qqGroup, temps.join('\n')).then(() => {
                sysLog('⇿', 'Discord消息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
            });
        }
    });
}

// 把表情解析成cq:image
async function parseEmoji(message: string): Promise<string> {
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
