import { BotService } from './bot.service';
import { BridgeConfig } from '../interface';
import config from '../config';
import {
  BridgeMessage, bridgeSendKaiheila,
  bridgeSendQQ,
  discordMessageToBridgeMessage, saveBridgeMessage,
} from './message-util';


export default async function bridgeDiscord() {
  BotService.discord.on('message', async (msg) => {
    // 无视自己的消息
    if (msg.author.id === config.discordBot || (config.bridges.find(opt => opt.discord.id === msg.author.id))) {
      return;
    }
    // 查询这个频道是否需要通知到群
    const bridge: BridgeConfig = config.bridges.find((opt) => opt.discord.channelID === msg.channel.id);
    if (!bridge) {
      return;
    }
    const bridgeMessage = await discordMessageToBridgeMessage(msg);
    bridgeMessage.bridge = bridge;
    await bridgeSendKaiheila(bridgeMessage);
    await bridgeSendQQ(bridgeMessage);
    await saveBridgeMessage(bridgeMessage);
  });
}
