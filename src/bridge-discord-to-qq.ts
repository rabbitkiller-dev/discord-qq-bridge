import { Client, Guild, Message, MessageAttachment, Webhook, WebhookMessageOptions } from "discord.js";
import { App, CQCode, RawSession, MessageInfo } from 'koishi';
import config from "./koishi.config";
import * as md5 from "md5";
import * as fs from "fs";
import * as path from "path";
import * as request from 'request';
import * as log from "./utils/log5";
import { GroupMemberInfo } from "koishi-adapter-cqhttp";
import { BridgeConfig } from "./interface";
import { DatabaseService } from "./database.service";
import { MessageEntity } from "./entity/message.entity";
import { createCanvas, loadImage } from "canvas";
import { KoishiAndDiscordService } from "./koishiAndDiscord.service";
import { downloadImage, imageCacheDir, imageDiscordAvatarCacheDir } from "./utils/download-file";
import { MatchUrlFromText } from './utils/match-url-from-text';
import { longUrlIntoShotUrl } from './utils/longurl-into-shoturl';
import { DToQUserLimitEntity } from './entity/dToQ-user-limit.entity';

export default async function () {
  KoishiAndDiscordService.discord.on('message', async (msg) => {
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
export async function toQQ(msg: Message) {
  // 无视自己的消息
  if (msg.author.id === config.discordBot || (config.bridges.find(opt => opt.discord.id === msg.author.id))) {
    return;
  }
  const bridge: BridgeConfig = config.bridges.find((opt) => opt.discord.channelID === msg.channel.id);
  // 查询这个频道是否需要通知到qq群
  if (!bridge) {
    return;
  }
  // 查询这个用户是否能同步到qq群
  const dToQUserLimitRepo = DatabaseService.connection.getRepository(DToQUserLimitEntity);
  const limit = await dToQUserLimitRepo.find({channel: msg.channel.id, user: msg.author.id});
  if (limit && limit.length > 0) {
    msg.reply('你的回复不会同步到qq群')
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
      // 转换长链接
      messageContent = await handlerLongUrlToShortUrl(messageContent, {msg: msg, bridge: bridge});
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
    if (temps.length > 0) {
      const msgID = await KoishiAndDiscordService.qqBot.bots[0].sendGroupMsg(bridge.qqGroup, temps.join('\n'));
      const qqMessage = await KoishiAndDiscordService.qqBot.bots[0].getMsg(msgID)
      handlerSaveMessage(qqMessage, msg).then();
      log.message('⇿', 'Discord消息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
    } else {
      temps.push('不支持该消息');
      const msgID = await KoishiAndDiscordService.qqBot.bots[0].sendGroupMsg(bridge.qqGroup, temps.join('\n'));
      const qqMessage = await KoishiAndDiscordService.qqBot.bots[0].getMsg(msgID)
      handlerSaveMessage(qqMessage, msg).then();
      log.message('⇿', 'Discord消息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
    }
  } catch (error) {
    log.error(error);
    const msgID = await KoishiAndDiscordService.qqBot.bots[0].sendGroupMsg(bridge.qqGroup, `发生错误导致消息同步失败:DiscordMsgID=${msg.id} \n${msg.content}`);
    const qqMessage = await KoishiAndDiscordService.qqBot.bots[0].getMsg(msgID)
    handlerSaveMessage(qqMessage, msg).then();
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
      const channel: any = await KoishiAndDiscordService.discord.channels.fetch(ctx.msg.channel.id);
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
  const atList: Array<{ username: string, qq: string, origin: string }> = [];
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
  if (atList.length === 0) {
    return message;
  }
  atList.forEach((at)=>{
    message = message.replace(at.origin, CQCode.stringify('at', {qq: at.qq}))
  })
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

// 缩短链接
async function handlerLongUrlToShortUrl(message: string, ctx: { msg: Message, bridge: BridgeConfig }): Promise<string> {
  const urls = MatchUrlFromText(message);
  if (!urls) {
    return message;
  }
  try {
    let newMessage = message;
    let footerCode = [];
    for (const url of urls) {
      // discord的gif图
      if (/https:\/\/tenor\.com\/view\/([\w]+-)+[0-9]+/.test(url)) {
        continue;
      }
      const result = await longUrlIntoShotUrl(url)
      footerCode.push(`\n[→ ${url}]`)
      newMessage = newMessage.replace(url, `<${result.shortLink}>`)
    }
    return newMessage + '\n' + footerCode.join('');
  } catch (e) {
    return message + '[error: 长链接转换出错]';
  }

}
