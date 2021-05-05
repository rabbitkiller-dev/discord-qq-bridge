import {Message as DiscordMessage, Message} from "discord.js";
import {Message as MiraiMessage, MessageType} from 'mirai-ts';
import {CQCode} from 'koishi';
import config from "./config";
import * as path from "path";
import * as fs from "fs";
import * as log from "./utils/log5";
import {BridgeConfig} from "./interface";
import {DatabaseService} from "./database.service";
import {MessageEntity} from "./entity/message.entity";
import {createCanvas, loadImage} from "canvas";
import {downloadDiscordAttachment, downloadImage, imageDiscordAvatarCacheDir} from "./utils/download-file";
import {BotService} from "./el-bot/bot.service";

export default async function () {
  BotService.discord.on('message', async (msg) => {
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
    let quote = undefined;
    const msgChain: MessageType.MessageChain = [];
    const temps: any[] = [];

    // 处理回复
    if (msg.reference && msg.reference.messageID) {
      const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
      const refMsg = await messageRepo.findOne({discordMessageID: msg.reference.messageID});
      // 尝试查找discord对应的qq消息id
      if (refMsg) {
        quote = refMsg.qqMessageID;
      } else {
        // 找不到就证明是旧的消息或者某些原因找不到, 那就纯文本当回复吧
        const channel: any = await BotService.discord.channels.fetch(msg.channel.id);
        const replyMsg = await channel.messages.fetch(msg.reference.messageID);
        msgChain.push(MiraiMessage.Plain(`回复消息：${replyMsg.content}\n`))
      }
    }

    // 添加用户名称在信息前面
    msgChain.push(await handlerUserAvatar(msg));
    msgChain.push(MiraiMessage.Plain(`@${msg.author.username}#${msg.author.discriminator}\n`));

    // 没有内容时不处理
    if (msg.content.trim()) {
      let messageContent = msg.content;
      // 处理回复
      messageContent = await parseEmoji(messageContent);
      // 处理@
      messageContent = await handlerAt(messageContent, {msg: msg, bridge: bridge});
      messageContent = await handlerAtQQUser(messageContent, {msg: msg, bridge: bridge});

      const cqMsg = CQCode.parseAll(messageContent);
      for(let source of cqMsg){
        if (typeof source === "string") {
          msgChain.push(MiraiMessage.Plain(source))
        } else {
          switch (source.type) {
            case 'at':
              msgChain.push(MiraiMessage.At(source.data.qq as any))
              break;
            case 'image':
              const filePath = await downloadDiscordAttachment({url: source.data.file});
              const relativePath = path.relative(path.join(__dirname, '../mcl/data/net.mamoe.mirai-api-http/images'), filePath);
              msgChain.push(MiraiMessage.Image(null, null, relativePath.replace(/\\/g, '/')))
              break;
            default:
              msgChain.push(MiraiMessage.Plain(JSON.stringify(source)))
          }
        }
      }
    }
    if (msg.attachments.size > 0) {
      const attachments = msg.attachments.array();
      for (let attachment of attachments) {
        const filePath = await downloadDiscordAttachment({url: attachment.url});
        const relativePath = path.relative(path.join(__dirname, '../mcl/data/net.mamoe.mirai-api-http/images'), filePath);
        msgChain.push(MiraiMessage.Image(null, null, relativePath.replace(/\\/g, '/')))
      }
    }
    const res = await BotService.qqBot.mirai.api.sendGroupMessage(msgChain, bridge.qqGroup, quote);
    const resMessage = await BotService.qqBot.mirai.api.messageFromId(res.messageId);
    handlerSaveMessage(resMessage as MessageType.GroupMessage, msg).then();
    log.message('⇿', 'Discord消息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
  } catch (error) {
    log.error(error);
    const res = await BotService.qqBot.mirai.api.sendGroupMessage(`程序出错消息格式化失败 来自discordMsgId=${msg.id} \n${msg.content}`, bridge.qqGroup);
    const resMessage = await BotService.qqBot.mirai.api.messageFromId(res.messageId);
    handlerSaveMessage(resMessage as MessageType.GroupMessage, msg).then();
  }
}

export async function translateCQCodeToMsgChain(cqMsg: string): Promise<MessageType.MessageChain> {
  const chain: MessageType.MessageChain = [];
  CQCode.parseAll(cqMsg).forEach((source) => {
    if (typeof source === "string") {
      chain.push(MiraiMessage.Plain(source))
    } else {
      switch (source.type) {
      }
    }

  })
  return chain;
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
export async function handlerUserAvatar(msg: Message): Promise<MessageType.Image> {
  const filePath = await downloadImage({url: msg.author.avatarURL({format: 'png'})});
  const img = await loadImage(filePath);
  const canvas = createCanvas(30, 30)
  const canvasCtx = canvas.getContext('2d');
  canvasCtx.arc(15, 15, 15, 0, Math.PI * 2, false)
  canvasCtx.clip()
  canvasCtx.drawImage(img, 0, 0, 30, 30);
  // const imgDataUrl = canvas.toDataURL();
  let stream = fs.createWriteStream(path.join(imageDiscordAvatarCacheDir, path.basename(filePath)));
  stream.write(canvas.toBuffer());
  stream.close();
  // const cqImage = CQCode.stringify('image', {file: 'file:///' + path.join(imageDiscordAvatarCacheDir, path.basename(filePath))});
  // const cqImage = CQCode.stringify('image', {file: imgDataUrl.replace('data:image/png;base64,', 'base64://')});
  // const cqImage = CQCode.stringify('image', {file: 'https://www.baidu.com/img/flexible/logo/pc/result.png'});
  // return `${cqImage} @${ctx.msg.author.username}#${ctx.msg.author.discriminator}`;
  let relativePath = path.relative(path.join(__dirname, '../mcl/data/net.mamoe.mirai-api-http/images'), path.join(imageDiscordAvatarCacheDir, path.basename(filePath)));
  return MiraiMessage.Image(null, null, relativePath.replace(/\\/g, '/'))
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
      const channel: any = await BotService.discord.channels.fetch(ctx.msg.channel.id);
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
  if (atList.length === 0) {
    return message;
  }
  atList.forEach((at)=>{
    message = message.replace(at.origin, CQCode.stringify('at', {qq: at.qq}))
  })
  return message;
}

// 保存关联消息
async function handlerSaveMessage(qqMessage: MessageType.GroupMessage, discordMessage: Message): Promise<MessageEntity> {
  const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
  const messageEntity = new MessageEntity();
  messageEntity.from = "qq";
  messageEntity.qqMessageID = qqMessage.messageChain[0].id.toString();
  messageEntity.qqMessage = {
    content: JSON.stringify(qqMessage.messageChain),
  }
  messageEntity.discordMessageID = discordMessage.id;
  messageEntity.discordMessage = {
    content: discordMessage.content,
    attachments: discordMessage.attachments.array() as any,
  }
  return messageRepo.save(messageEntity);
}
