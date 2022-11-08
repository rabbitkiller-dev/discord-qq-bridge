import { BotService } from "./bot.service";
import { BridgeConfig } from "../interface";
import config from "../config";
import {
	BridgeMessage,
	// bridgeSendDiscord,
	bridgeSendKaiheila,
	bridgeSendQQ,
	discordMessageToBridgeMessage,
	saveBridgeMessage,
} from "./message-util";
import * as log from "../utils/log5";

export default async function bridgeDiscord() {
	BotService.discord.on("message", async (msg) => {
		// 无视自己的消息
		if (
			msg.author.id === config.discordBot ||
			config.bridges.find((opt) => opt.discord.id === msg.author.id)
		) {
			return;
		}
		// 查询这个频道是否需要通知到群
		const bridge: BridgeConfig = config.bridges.find(
			(opt) => opt.discord.channelID === msg.channel.id
		);
		if (!bridge || bridge.enable === false) {
			return;
		}
		const bridgeMessage: BridgeMessage = await discordMessageToBridgeMessage(msg);
		bridgeMessage.bridge = bridge;
		try {
			await bridgeSendQQ(bridgeMessage);
		} catch (err) {
			log.error(err);
			log.error("[DC]->[QQ] 失败!(不应该出现的错误)");
		}
		try {
			await bridgeSendKaiheila(bridgeMessage);
		} catch (err) {
			log.error(err);
			log.error("[DC]->[KHL] 失败!(不应该出现的错误)");
		}
		await saveBridgeMessage(bridgeMessage);
	});
}
