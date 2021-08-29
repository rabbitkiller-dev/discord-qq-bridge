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
  bridgeSendDiscord, bridgeSendKaiheila,
  discordMessageToBridgeMessage, qqMessageToBridgeMessage, saveBridgeMessage,
} from './message-util';


export default async function bridgeQq() {
  BotService.qqBot.mirai.on('GroupMessage', async (qqMsg: MessageType.GroupMessage) => {
    // 查询这个频道是否需要通知到群
    const bridge: BridgeConfig = config.bridges.find(b => b.qqGroup === qqMsg.sender.group.id);
    if (!bridge || !bridge.kaiheila) {
      return;
    }
    const bridgeMessage = await qqMessageToBridgeMessage(qqMsg);
    bridgeMessage.bridge = bridge;
    await bridgeSendDiscord(bridgeMessage);
    await bridgeSendKaiheila(bridgeMessage);
    await saveBridgeMessage(bridgeMessage);
    // log.error('[Discord]->[Kaiheila] 失败!(不应该出现的错误)');
    // log.error('[Discord]->[QQ] 失败!(不应该出现的错误)');
    // log.error('[Kaiheila]->[Discord] 失败!(不应该出现的错误)');
    // log.error('[Kaiheila]->[QQ] 失败!(不应该出现的错误)');
  });
}
