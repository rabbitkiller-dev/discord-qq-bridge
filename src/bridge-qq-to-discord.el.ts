// import config from "./config";
// import { Config as MiraiConfig, MessageType } from "mirai-ts";
// import {
//   Guild,
//   Message,
//   Message as DiscordMessage,
//   MessageAttachment,
//   Webhook,
//   WebhookMessageOptions
// } from "discord.js";
// import { BotService } from "./el-bot/bot.service";
// import { downloadQQImage } from "./utils/download-file";
// import { MessageEntity } from "./entity/message.entity";
// import { DatabaseService } from "./database.service";
// import * as log from './utils/log5';
// import * as xmlUtil from 'fast-xml-parser';
// import { BridgeConfig } from './interface';
// import * as KaiheilaBotRoot from 'kaiheila-bot-root';
//
// export default async function () {
//   BotService.qqBot.mirai.on('GroupMessage', async (qqMsg) => {
//     await toDiscord(qqMsg);
//     try {
//       await toKaiheila(qqMsg);
//     } catch (error) {
//       log.error('[Discord]->[Kaiheila] 失败!(不应该出现的错误)');
//       log.error(error);
//     }
//   });
// }
//
// async function toDiscord(qqMsg: MessageType.GroupMessage) {
//   const bridge: BridgeConfig = config.bridges.find(b => b.qqGroup === qqMsg.sender.group.id);
//   if (!bridge || !bridge.discord) {
//     return;
//   }
//   let resMessage: DiscordMessage;
//   try {
//     // 获取webhook
//     const webhook = await BotService.discord.fetchWebhook(bridge.discord.id, bridge.discord.token);
//     // 处理消息
//     let messageContent = '';
//     const option: WebhookMessageOptions = {
//       username: `${qqMsg.sender.memberName}(${qqMsg.sender.id})`,
//       avatarURL: `https://q1.qlogo.cn/g?b=qq&nk=${qqMsg.sender.id}&s=100&t=${Math.random()}`,
//       // avatarURL: `https://q.qlogo.cn/g?b=qq&nk={uid}&s=100&t={Math.random()}
//       // avatarURL: `http://q.qlogo.cn/headimg_dl?bs=qq&dst_uin=${qqMessage.sender.userId}&src_uin=www.feifeiboke.com&fid=blog&spec=640&t=${Math.random()}` // 高清地址
//       files: [],
//     }
//     for (const msg of qqMsg.messageChain) {
//       switch (msg.type) {
//         case 'Source':
//           break;
//         case 'Quote':
//           messageContent += await handlerForward(msg);
//           break;
//         case 'Plain':
//           messageContent += msg.text;
//           break;
//         case 'At':
//           const memberInfos = await BotService.qqBot.mirai.api.memberList(qqMsg.sender.group.id);
//           const memberInfo = memberInfos.find(member => member.id === msg.target);
//           if (memberInfo) {
//             messageContent += `\`@${memberInfo.memberName}(${msg.target})\``;
//           }
//           break;
//         case 'AtAll':
//           messageContent += `@everyone`;
//           break;
//         case 'Face':
//           messageContent += `[Face=${msg.faceId},${msg.name}]`;
//           break;
//         case 'Image':
//           const filePath = await downloadQQImage({url: msg.url});
//           const attr = new MessageAttachment(filePath);
//           option.files.push(attr);
//           break;
//         case 'Xml':
//           messageContent += await handlerXml(msg);
//           break;
//         case 'App':
//           const content = JSON.parse(msg.content) as any;
//           messageContent += `> ** ${content.prompt} **\n`
//           messageContent += `> ${content.meta.detail_1.desc}\n`
//           messageContent += `> ${content.meta.detail_1.qqdocurl}\n`
//           break;
//         default:
//           messageContent += JSON.stringify(msg);
//       }
//     }
//     // 处理@ discord用户
//     messageContent = await handlerAtDiscordUser(messageContent, webhook);
//     // 发送消息
//     option.content = messageContent;
//     resMessage = await webhook.send(option) as DiscordMessage;
//     handlerSaveMessage(qqMsg, resMessage).then();
//   } catch (error) {
//     log.error(error);
//     const webhook = await BotService.discord.fetchWebhook(bridge.discord.id, bridge.discord.token);
//     const option: WebhookMessageOptions = {
//       username: `${qqMsg.sender.memberName}(${qqMsg.sender.id})`,
//       avatarURL: `https://q1.qlogo.cn/g?b=qq&nk=${qqMsg.sender.id}&s=100&t=${Math.random()}`,
//       // avatarURL: `https://q.qlogo.cn/g?b=qq&nk={uid}&s=100&t={Math.random()}
//       // avatarURL: `http://q.qlogo.cn/headimg_dl?bs=qq&dst_uin=${qqMessage.sender.userId}&src_uin=www.feifeiboke.com&fid=blog&spec=640&t=${Math.random()}` // 高清地址
//       files: [],
//     }
//     option.content = `程序出错消息格式化失败:QQMsgID=${qqMsg.messageChain[0].id} \n${JSON.stringify(qqMsg.messageChain)}`;
//     resMessage = await webhook.send(option) as DiscordMessage;
//     handlerSaveMessage(qqMsg, resMessage).then();
//     return;
//   }
//
// }
//
// // 处理回复消息
// async function handlerForward(quoteMsg: MessageType.Quote): Promise<string> {
//   const memberInfo = await BotService.qqBot.mirai.api.memberInfo(quoteMsg.groupId, quoteMsg.senderId) as MiraiConfig.MemberInfo;
//   let messageContent = `** 回复 @${memberInfo.name} 在 {暂无日期} 的消息 **\n`;
//   for (const msg of quoteMsg.origin) {
//     switch (msg.type) {
//       case 'Source':
//         break;
//       case 'Quote':
//         break;
//       case 'Plain':
//         messageContent += msg.text;
//         break;
//       case 'At':
//         const memberInfo = await BotService.qqBot.mirai.api.memberInfo(quoteMsg.groupId, msg.target) as MiraiConfig.MemberInfo;
//         messageContent += `\`@${memberInfo.name}(${msg.target})\``;
//         break;
//       case 'AtAll':
//         messageContent += `\`@everyone\``;
//         break;
//       case 'Face':
//         messageContent += `[Face=${msg.faceId},${msg.name}]`;
//         break;
//       case 'Image':
//         messageContent += `:frame_photo:`;
//         break;
//       default:
//         messageContent += JSON.stringify(msg);
//     }
//   }
//
//   messageContent = messageContent.split('\n').map((str) => '> ' + str).join('\n') + '\n'
//   return messageContent;
// }
//
// // 处理Xml消息
// async function handlerXml(msg: MessageType.Xml): Promise<string> {
//   let messageContent = '';
//   const xmlData = xmlUtil.parse(msg.xml, {
//     attributeNamePrefix: '',
//     attrNodeName: 'attribute',
//     ignoreAttributes: false,
//   });
//   if (xmlData.msg && xmlData.msg.attribute && xmlData.msg.attribute.serviceID === '1') {
//     messageContent += `> ** 转发消息 **\n`
//     messageContent += `> ${xmlData.msg.item.summary}\n`
//     messageContent += `> ${xmlData.msg.attribute.url}\n`
//   } else if (xmlData.msg && xmlData.msg.attribute && xmlData.msg.attribute.serviceID === '35') {
//     messageContent += `> ** 转发消息 **\n`
//     xmlData.msg.title.forEach((title) => {
//       messageContent += `> ${title['#text']}\n`;
//     })
//   } else {
//     messageContent = JSON.stringify(msg.xml)
//   }
//
//   return messageContent;
// }
//
//
// // 处理@ discord用户
// async function handlerAtDiscordUser(message: string, webhook: Webhook): Promise<string> {
//   const atList: Array<{ username: string, discriminator: string, origin: string }> = [];
//   // 正则匹配
//   [
//     /&#91;@([^\n#]+)#(\d\d\d\d)&#93;/, // [@rabbitkiller#7372]
//     /`@([^\n#]+)#(\d\d\d\d)`/, // `@rabbitkiller#7372`
//     /@([^\n#]+)#(\d\d\d\d)/, // @rabbitkiller#7372
//     // 不需要#号的
//     /&#91;@([^\n#]+)&#93;/, // [@rabbitkiller]
//     /`@([^\n#]+)`/, // `@rabbitkiller`
//   ].forEach((reg) => {
//     const gReg = new RegExp(reg.source, 'g');
//     const sReg = new RegExp(reg.source);
//     // 全局匹配满足条件的
//     const strList = message.match(gReg);
//     if (!strList) {
//       return;
//     }
//     strList.forEach((str) => {
//       // 获取用户名, 保留origin匹配上的字段用来replace
//       if (str.match(sReg)[1]) {
//         atList.push(
//           {origin: str, username: str.match(sReg)[1].trim(), discriminator: str.match(sReg)[2]}
//         )
//       }
//     })
//   })
//   if (atList.length === 0) {
//     return message;
//   }
//   // 获取guild, 在通过guild获取所有用户
//   const guild: Guild = await BotService.discord.guilds.fetch(webhook.guildId);
//   const fetchedMembers = await guild.members.fetch();
//   fetchedMembers.forEach((member) => {
//     // 匹配用户名
//     const ats = atList.filter(at => at.username === member.user.username);
//     if (ats.length === 0) {
//       return;
//     }
//     // 替换
//     ats.forEach((at) => {
//       message = message.replace(at.origin, `<@!${member.user.id}>`)
//     })
//   });
//   return message;
// }
//
// // 保存关联消息
// async function handlerSaveMessage(qqMessage: MessageType.GroupMessage, discordMessage: Message): Promise<MessageEntity> {
//   const messageRepo = DatabaseService.connection.getRepository(MessageEntity);
//   const messageEntity = new MessageEntity();
//   messageEntity.from = "qq";
//   messageEntity.qqMessageID = qqMessage.messageChain[0].id.toString();
//   messageEntity.qqMessage = {
//     content: JSON.stringify(qqMessage.messageChain),
//   }
//   messageEntity.discordMessageID = discordMessage.id;
//   messageEntity.discordMessage = {
//     content: discordMessage.content,
//     attachments: Array.from(discordMessage.attachments.values()) as any,
//   }
//   return messageRepo.save(messageEntity);
// }
//
// /**
//  * 发送到Kaiheila
//  */
// async function toKaiheila(qqMsg: MessageType.GroupMessage) {
//   // 查询这个频道是否需要通知到群
//   const bridge: BridgeConfig = config.bridges.find(b => b.qqGroup === qqMsg.sender.group.id);
//   if (!bridge || !bridge.kaiheila) {
//     return;
//   }
//   // 处理消息
//   let messageContent = '';
//   for (const msg of qqMsg.messageChain) {
//     switch (msg.type) {
//       case 'Source':
//         break;
//       case 'Quote':
//         messageContent += await handlerForward(msg);
//         break;
//       case 'Plain':
//         messageContent += msg.text;
//         break;
//       case 'At':
//         const memberInfos = await BotService.qqBot.mirai.api.memberList(qqMsg.sender.group.id);
//         const memberInfo = memberInfos.find(member => member.id === msg.target);
//         if (memberInfo) {
//           messageContent += `\`@${memberInfo.memberName}(${msg.target})\``;
//         }
//         break;
//       case 'AtAll':
//         messageContent += `@everyone`;
//         break;
//       case 'Face':
//         messageContent += `[Face=${msg.faceId},${msg.name}]`;
//         break;
//       case 'Image':
//         // const filePath = await downloadQQImage({url: msg.url});
//         // const attr = new MessageAttachment(filePath);
//         // option.files.push(attr);
//         break;
//       case 'Xml':
//         messageContent += await handlerXml(msg);
//         break;
//       case 'App':
//         const content = JSON.parse(msg.content) as any;
//         messageContent += `> ** ${content.prompt} **\n`
//         messageContent += `> ${content.meta.detail_1.desc}\n`
//         messageContent += `> ${content.meta.detail_1.qqdocurl}\n`
//         break;
//       default:
//         messageContent += JSON.stringify(msg);
//     }
//   }
//
//   const msgText = JSON.stringify([
//     {
//       "type": "card",
//       "theme": "secondary",
//       "size": "lg",
//       "modules": [
//         {
//           "type": "section",
//           "text": {
//             "type": "plain-text",
//             "content": `@${qqMsg.sender.memberName}(${qqMsg.sender.id}) From [QQ]`
//           },
//           "mode": "left",
//           "accessory": {
//             "type": "image",
//             "src": 'https://img.kaiheila.cn/assets/2021-01/7kr4FkWpLV0ku0ku.jpeg',
//             // "src": msg.author.avatarURL({format: 'png'}),
//             "size": "sm",
//             "circle": true
//           }
//         },
//         {
//           "type": "section",
//           "text": {
//             "type": "kmarkdown",
//             "content": messageContent
//           }
//         }
//       ]
//     }
//   ]);
//   const resultMessage = await BotService.kaiheila.post('https://www.kaiheila.cn/api/v3/message/create', {
//     type: KaiheilaBotRoot.MessageType.card,
//     target_id: bridge.kaiheila.channelID,
//     content: msgText
//   });
//   console.log(resultMessage);
// }
