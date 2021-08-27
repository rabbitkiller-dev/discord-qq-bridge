import { Message as DiscordMessage, MessageAttachment, WebhookMessageOptions } from 'discord.js';
import { Message as MiraiMessage, MessageType } from 'mirai-ts';
import { KaiheilaAllMessage } from './interface';
import * as KaiheilaBotRoot from 'kaiheila-bot-root';
import { DatabaseService } from '../database.service';
import { MessageEntity } from '../entity/message.entity';
import { BotService } from './bot.service';
import { MessageUtil } from './message';
import { BridgeConfig } from '../interface';

export class BridgeMessage {
  source: 'QQ' | 'KHL' | 'DC';
  author: {
    username: string;
    avatar: string;
    discriminator?: number | string;
  } = {
    avatar: undefined,
    username: 'NoneUserName',
  }
  quote?: string;
  quoteMessage?: BridgeMessage;
  chain: MessageType.MessageChain = [];
  bridge: BridgeConfig;

  constructor() {
  }

}


export async function kaiheilaMessageToBridgeMessage(allMessage: KaiheilaAllMessage): Promise<BridgeMessage> {
  const bridgeMessage = new BridgeMessage();
  bridgeMessage.source = 'KHL';
  // 头像
  // 添加用户名称在信息前面
  let avatar: MessageType.Image;

  if (allMessage.data.type === KaiheilaBotRoot.MessageType.text) {
    const kaiMsg: KaiheilaBotRoot.TextMessage = allMessage.data as any;
    // avatar = await generateQQMsgContentAvatar(kaiMsg.author.avatar);
    // if (avatar) {
    //   msgChain.push(avatar);
    // }
    bridgeMessage.author.username = kaiMsg.author.nickname;
    bridgeMessage.author.discriminator = kaiMsg.author.identifyNum;
    bridgeMessage.chain.push(MessageUtil.Plain(kaiMsg.content));
  }
  return bridgeMessage;
}

export async function discordMessageToBridgeMessage(msg: DiscordMessage): Promise<BridgeMessage> {
  const bridgeMessage = new BridgeMessage();
  bridgeMessage.source = 'DC';
  // 处理回复
  if (msg.reference && msg.reference.messageID) {
    const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
    const refMsg = await messageRepo.findOne({discordMessageID: msg.reference.messageID});
    // 尝试查找discord对应的qq消息id
    if (refMsg) {
      bridgeMessage.quote = refMsg.qqMessageID;
    } else {
      // 找不到就证明是旧的消息或者某些原因找不到, 那就纯文本当回复吧
      const channel: any = await BotService.discord.channels.fetch(msg.channel.id);
      const replyMsg = await channel.messages.fetch(msg.reference.messageID);
      bridgeMessage.quoteMessage.chain.push(MessageUtil.Plain(`回复消息：${replyMsg.content}\n`))
    }
  }
  // 头像
  if (msg.author.avatar) {
    bridgeMessage.author.avatar = msg.author.avatarURL({format: 'png'});
  }
  bridgeMessage.author.username = msg.author.username;
  bridgeMessage.author.discriminator = msg.author.discriminator;
  // 内容
  bridgeMessage.chain.push(MessageUtil.Plain(msg.content));
  return bridgeMessage;
}

export async function qqMessageToBridgeMessage(qqMsg: MessageType.GroupMessage): Promise<BridgeMessage> {
  const bridgeMessage = new BridgeMessage();
  bridgeMessage.source = 'QQ';
  for (const msg of qqMsg.messageChain) {
    switch (msg.type) {
      case 'Source':
        break;
      // case 'Quote':
        // messageContent += await handlerForward(msg);
        // break;
      case 'Plain':
        bridgeMessage.chain.push(MessageUtil.Plain(msg.text));
        break;
      // case 'At':
      //   break;
      // case 'AtAll':
      //   messageContent += `@everyone`;
      //   break;
      // case 'Face':
      //   messageContent += `[Face=${msg.faceId},${msg.name}]`;
      //   break;
      // case 'Image':
      //   const filePath = await downloadQQImage({url: msg.url});
      //   const attr = new MessageAttachment(filePath);
      //   option.files.push(attr);
      //   break;
      // case 'Xml':
      //   messageContent += await handlerXml(msg);
      //   break;
      // case 'App':
      //   const content = JSON.parse(msg.content) as any;
      //   messageContent += `> ** ${content.prompt} **\n`
      //   messageContent += `> ${content.meta.detail_1.desc}\n`
      //   messageContent += `> ${content.meta.detail_1.qqdocurl}\n`
      //   break;
      default:
        bridgeMessage.chain.push(MessageUtil.Plain(JSON.stringify(msg)));
    }
  }
  bridgeMessage.author.username = `${qqMsg.sender.memberName}(${qqMsg.sender.id})`;
  bridgeMessage.author.avatar = `https://q1.qlogo.cn/g?b=qq&nk=${qqMsg.sender.id}&s=100`;
  return bridgeMessage;
}

export async function bridgeSendQQ(bridgeMessage: BridgeMessage) {
  bridgeMessage.chain.unshift(MiraiMessage.Plain(`@[${bridgeMessage.source}] ${bridgeMessage.author.username}#${bridgeMessage.author.discriminator}\n`));
  const res = await BotService.qqBot.mirai.api.sendGroupMessage(bridgeMessage.chain, bridgeMessage.bridge.qqGroup, parseInt(bridgeMessage.quote));
}

export async function bridgeSendDiscord(bridgeMessage: BridgeMessage) {
  const option: WebhookMessageOptions = {
    username: `[${bridgeMessage.source}] ${bridgeMessage.author.username}`,
    avatarURL: bridgeMessage.author.avatar,
    files: [],
  }
  // 获取webhook
  const webhook = await BotService.discord.fetchWebhook(bridgeMessage.bridge.discord.id, bridgeMessage.bridge.discord.token);
  // 处理消息
  let messageContent = '';
  for (const msg of bridgeMessage.chain) {
    switch (msg.type) {
      case 'Plain':
        messageContent += msg.text;
        break;
      default:
        messageContent += JSON.stringify(msg);
    }
  }
  await webhook.send(messageContent, option) as DiscordMessage;
}

export async function bridgeSendKaiheila(bridgeMessage: BridgeMessage) {
  // 处理消息
  let messageContent = '';
  for (const msg of bridgeMessage.chain) {
    switch (msg.type) {
      case 'Plain':
        messageContent += msg.text;
        break;
      default:
        messageContent += JSON.stringify(msg);
    }
  }

  const msgText = JSON.stringify([
    {
      "type": "card",
      "theme": "secondary",
      "size": "lg",
      "modules": [
        {
          "type": "section",
          "text": {
            "type": "plain-text",
            "content": `@[${bridgeMessage.source}] ${bridgeMessage.author.username}${bridgeMessage.author.discriminator ? `#${bridgeMessage.author.discriminator}` : ''}`
          },
          "mode": "left",
          "accessory": {
            "type": "image",
            "src": 'https://img.kaiheila.cn/assets/2021-01/7kr4FkWpLV0ku0ku.jpeg',
            // "src": msg.author.avatarURL({format: 'png'}),
            "size": "sm",
            "circle": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "kmarkdown",
            "content": messageContent
          }
        }
      ]
    }
  ]);
  await BotService.kaiheila.post('https://www.kaiheila.cn/api/v3/message/create', {
    type: KaiheilaBotRoot.MessageType.card,
    target_id: bridgeMessage.bridge.kaiheila.channelID,
    content: msgText
  });
}
