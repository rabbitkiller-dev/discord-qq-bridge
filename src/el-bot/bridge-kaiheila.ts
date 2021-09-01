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
  kaiheilaMessageToBridgeMessage, saveBridgeMessage,
} from './message-util';


export default async function bridgeKai() {
  BotService.kaiheila.on('allMessages', async (allMessage: KaiheilaAllMessage) => {
    if(allMessage.data.authorId === '140691480'){
      return;
    }
    // 查询这个频道是否需要通知到群
    const bridge: BridgeConfig = config.bridges.find((opt) => opt.kaiheila?.channelID === allMessage.data.channelId);
    if (!bridge || bridge.enable === false) {
      return;
    }
    const bridgeMessage = await kaiheilaMessageToBridgeMessage(allMessage);
    bridgeMessage.bridge = bridge;
    await bridgeSendDiscord(bridgeMessage);
    await bridgeSendQQ(bridgeMessage);
    await saveBridgeMessage(bridgeMessage);
  });
}

