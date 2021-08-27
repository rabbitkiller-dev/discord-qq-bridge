import { BotService } from './bot.service';
import * as log from '../utils/log5';
import * as miraiTs from 'mirai-ts';
import * as KaiheilaBotRoot from 'kaiheila-bot-root';
import { BridgeConfig } from '../interface';
import config from '../config';
import { Message as DiscordMessage, WebhookMessageOptions } from 'discord.js';
import { Message as MiraiMessage, MessageType } from 'mirai-ts';
import { KaiheilaAllMessage } from './interface';
import {
  BridgeMessage, bridgeSendDiscord,
  bridgeSendQQ,
  kaiheilaMessageToBridgeMessage
} from './message-util';


export default async function bridgeKai() {
  BotService.kaiheila.on('allMessages', async (allMessage: KaiheilaAllMessage) => {
    if(allMessage.data.authorId === '140691480'){
      return;
    }
    // 查询这个频道是否需要通知到群
    const bridge: BridgeConfig = config.bridges.find((opt) => opt.kaiheila?.channelID === allMessage.data.channelId);
    if (!bridge) {
      return;
    }
    const bridgeMessage = await kaiheilaMessageToBridgeMessage(allMessage);
    bridgeMessage.bridge = bridge;
    await bridgeSendDiscord(bridgeMessage);
    await bridgeSendQQ(bridgeMessage);
  });
}

async function toDiscord(allMessage: KaiheilaAllMessage) {
  const bridge: BridgeConfig = config.bridges.find((opt) => opt.kaiheila?.channelID === allMessage.data.channelId);
  if (!bridge || !bridge.discord) {
    return;
  }
  // 获取webhook
  const webhook = await BotService.discord.fetchWebhook(bridge.discord.id, bridge.discord.token);
  // 处理消息
  let messageContent = '';
  const option: WebhookMessageOptions = {
    // username: `${qqMsg.sender.memberName}(${qqMsg.sender.id})`,
    // avatarURL: `https://q1.qlogo.cn/g?b=qq&nk=${qqMsg.sender.id}&s=100&t=${Math.random()}`,
    // avatarURL: `https://q.qlogo.cn/g?b=qq&nk={uid}&s=100&t={Math.random()}
    // avatarURL: `http://q.qlogo.cn/headimg_dl?bs=qq&dst_uin=${qqMessage.sender.userId}&src_uin=www.feifeiboke.com&fid=blog&spec=640&t=${Math.random()}` // 高清地址
    files: [],
  }
  if (allMessage.data.type === KaiheilaBotRoot.MessageType.text) {
    const kaiMsg: KaiheilaBotRoot.TextMessage = allMessage.data as any;
    // kaiMsg.channelId
    messageContent = kaiMsg.content;
    option.username = `${kaiMsg.author.nickname}#${kaiMsg.author.identifyNum} From [kaiheila]`
    option.avatarURL = kaiMsg.author.avatar;
  }
  // 发送消息
  const resMessage: DiscordMessage = await webhook.send(messageContent, option) as DiscordMessage;
}


/**
 * 转发到QQ
 */
async function toQQ(allMessage: KaiheilaAllMessage) {
  const bridge: BridgeConfig = config.bridges.find((opt) => opt.kaiheila?.channelID === allMessage.data.channelId);
  if (!bridge || !bridge.qqGroup) {
    return;
  }
  const bridgeMessage = await kaiheilaMessageToBridgeMessage(allMessage);
  bridgeMessage.chain.unshift(MiraiMessage.Plain(`@[KHL] ${bridgeMessage.author.username}#${bridgeMessage.author.discriminator}\n`));
  const res = await BotService.qqBot.mirai.api.sendGroupMessage(bridgeMessage.chain, bridge.qqGroup, parseInt(bridgeMessage.quote));
}

