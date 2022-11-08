import {
	Guild,
	Message as DiscordMessage,
	MessageAttachment,
	MessageEmbed,
	Webhook as DiscordWebhook,
	WebhookMessageOptions
} from "discord.js";
import { Message as MiraiMessage, Config as MiraiConfig, MessageType } from "mirai-ts";
import { At, AtAll, Image, KaiheilaAllMessage, Plain, SingleMessage } from "./interface";
import * as KaiheilaBotRoot from "kaiheila-bot-root";
import { DatabaseService } from "../database.service";
import { BotService } from "./bot.service";
import { MessageUtil } from "./message";
import { BridgeConfig } from "../interface";
import { bridgeRule, generateQQMsgContentAvatar, remoteImageToLocal } from "./utils";
import { markdownEngine, rules } from "discord-markdown";
import { BridgeMessageEntity } from "../entity/bridge-message.entity";
import { download } from "../utils/download-file";
import { KhlInterface } from "./khl-interface";
import * as path from "path";
import * as log from "../utils/log5";

export class BridgeMessage {
	author: {
		username: string;
		avatar: string;
		qqNumber?: number;
		discriminator?: string;
	} = {
		qqNumber: undefined,
		avatar: undefined,
		username: "NoneUserName",
	};
	quoteMessage?: BridgeMessage;
	chain: SingleMessage[] = [];
	bridge: BridgeConfig;

	origin: {
		khlMessage: KaiheilaAllMessage,
		dcMessage: DiscordMessage,
	} = {} as any;
	from: BridgeMessageEntity = new BridgeMessageEntity();

	constructor(public source: "QQ" | "KHL" | "DC") {
		this.from.from = this.source;
	}

}

/**
 * 开黑啦 消息转成 BridgeMessage 统一消息格式
 */
export async function kaiheilaMessageToBridgeMessage(allMessage: KaiheilaAllMessage): Promise<BridgeMessage> {
	const bridgeMessage = new BridgeMessage("KHL");
	bridgeMessage.origin.khlMessage = allMessage;
	bridgeMessage.from.khlMessageID = allMessage.data.msgId;


	bridgeMessage.author.username = allMessage.data.author.nickname;
	bridgeMessage.author.discriminator = allMessage.data.author.identifyNum;
	bridgeMessage.author.avatar = allMessage.data.author.avatar;
	if (allMessage.data.type === KaiheilaBotRoot.MessageType.text) {
		const kaiMsg: KaiheilaBotRoot.TextMessage = allMessage.data as any;
		bridgeMessage.chain.push(MessageUtil.Plain(kaiMsg.content));
	} else if (allMessage.data.type === KaiheilaBotRoot.MessageType.image) {
		const kaiMsg: KaiheilaBotRoot.ImageMessage = allMessage.data as any;
		bridgeMessage.chain.push(MessageUtil.Image(kaiMsg.attachment.url));
	}
	if (allMessage.data.quote) {
		const quoteMessage = allMessage.data.quote;

		const messageRepo = DatabaseService.connection.getRepository(BridgeMessageEntity);
		const refMsg = await messageRepo.findOne({khlMessageID: quoteMessage.msgId});
		bridgeMessage.quoteMessage = new BridgeMessage("KHL");
		// 尝试查找discord对应的qq消息id
		if (refMsg) {
			bridgeMessage.quoteMessage.from = refMsg;
		}
		bridgeMessage.quoteMessage.author.username = quoteMessage.author.nickname;
		bridgeMessage.quoteMessage.author.discriminator = quoteMessage.author.identifyNum;
		bridgeMessage.quoteMessage.author.avatar = quoteMessage.author.avatar;
		if (allMessage.data.type === KaiheilaBotRoot.MessageType.text) {
			const kaiMsg: KaiheilaBotRoot.TextMessage = allMessage.data as any;
			bridgeMessage.quoteMessage.chain.push(MessageUtil.Plain(kaiMsg.content));
		} else if (allMessage.data.type === KaiheilaBotRoot.MessageType.image) {
			const kaiMsg: KaiheilaBotRoot.ImageMessage = allMessage.data as any;
			bridgeMessage.quoteMessage.chain.push(MessageUtil.Image(kaiMsg.attachment.url));
		}
	}
	return bridgeMessage;
}

/**
 * Discord 消息转成 BridgeMessage 统一消息格式
 */
export async function discordMessageToBridgeMessage(msg: DiscordMessage): Promise<BridgeMessage> {
	const bridgeMessage = new BridgeMessage("DC");
	bridgeMessage.origin.dcMessage = msg;
	bridgeMessage.from.dcMessageID = msg.id;
	// 处理回复
	if (msg.reference && msg.reference.messageID) {
		const messageRepo = DatabaseService.connection.getRepository(BridgeMessageEntity);
		const refMsg = await messageRepo.findOne({dcMessageID: msg.reference.messageID});
		bridgeMessage.quoteMessage = new BridgeMessage("DC");
		// 尝试查找discord对应的qq消息id
		if (refMsg) {
			bridgeMessage.quoteMessage.from = refMsg;
		}
		// 找不到就证明是旧的消息或者某些原因找不到, 那就纯文本当回复吧
		const channel: any = await BotService.discord.channels.fetch(msg.channel.id);
		const replyMsg = await channel.messages.fetch(msg.reference.messageID);
		if (replyMsg.author.discriminator === "0000") {
			const ast = markdownEngine.parserFor({
				atQQ: bridgeRule.atQQ,
				atKHL: bridgeRule.atKHL,
				Plain: bridgeRule.Plain
			})(`@${replyMsg.author.username}`);
			console.log(ast);
			bridgeMessage.quoteMessage.author = {...ast[0]} as any;
		} else {
			bridgeMessage.quoteMessage.author.username = replyMsg.author.username;
			bridgeMessage.quoteMessage.author.discriminator = replyMsg.author.discriminator;
			bridgeMessage.quoteMessage.author.avatar = replyMsg.author.avatarURL({format: "png"});
		}
		if (replyMsg.content) {
			bridgeMessage.quoteMessage.chain.push(...(await parserDCMessage(replyMsg.content, bridgeMessage.quoteMessage)));
		}
	}
	// 头像
	if (msg.author.avatar) {
		bridgeMessage.author.avatar = msg.author.avatarURL({format: "png"});
	}
	bridgeMessage.author.username = msg.author.username;
	bridgeMessage.author.discriminator = msg.author.discriminator;
	if (msg.content) {
		bridgeMessage.chain.push(...(await parserDCMessage(msg.content, bridgeMessage)));
	}
	if (msg.attachments.size > 0) {
		const attachments = Array.from(msg.attachments.values());
		for (const attachment of attachments) {
			// const filePath = await downloadDiscordAttachment({url: attachment.url});
			// const relativePath = path.relative(path.join(__dirname, '../mcl/data/net.mamoe.mirai-api-http/images'), filePath);
			bridgeMessage.chain.push(MessageUtil.Image(attachment.url));
		}
	}
	return bridgeMessage;
}

/**
 * QQ 消息转成 BridgeMessage 统一消息格式
 */
export async function qqMessageToBridgeMessage(qqMsg: MessageType.GroupMessage, bridge: BridgeConfig): Promise<BridgeMessage> {
	const bridgeMessage = new BridgeMessage("QQ");
	bridgeMessage.bridge = bridge;
	await qqMessageChainToBridgeMessageChain(bridgeMessage, qqMsg.messageChain);
	bridgeMessage.author.username = qqMsg.sender.memberName;
	bridgeMessage.author.qqNumber = qqMsg.sender.id;
	bridgeMessage.author.avatar = `https://q1.qlogo.cn/g?b=qq&nk=${qqMsg.sender.id}&s=100`;
	return bridgeMessage;
}

async function qqMessageChainToBridgeMessageChain(bridgeMessage: BridgeMessage, chain: MessageType.MessageChain, quote = false) {
	for (const msg of chain) {
		switch (msg.type) {
		case "Source":
			bridgeMessage.from.qqMessageID = msg.id.toString();
			break;
		case "Quote":
			if (quote) {
				break;
			}
			const messageRepo = DatabaseService.connection.getRepository(BridgeMessageEntity);
			const refMsg = await messageRepo.findOne({qqMessageID: msg.id.toString()});
			bridgeMessage.quoteMessage = new BridgeMessage(refMsg.from);
			// 尝试查找discord对应的qq消息id
			if (refMsg) {
				bridgeMessage.quoteMessage.from = refMsg;
			}
			const quoteAuthor = await BotService.qqBot.mirai.api.memberInfo(msg.targetId, msg.senderId) as MiraiConfig.MemberInfo;
			bridgeMessage.quoteMessage.author.username = quoteAuthor.name;
			bridgeMessage.quoteMessage.author.qqNumber = msg.senderId;
			bridgeMessage.quoteMessage.author.avatar = `https://q1.qlogo.cn/g?b=qq&nk=${msg.senderId}&s=100`;
			bridgeMessage.quoteMessage.bridge = bridgeMessage.bridge;
			await qqMessageChainToBridgeMessageChain(bridgeMessage.quoteMessage, msg.origin, true);
			break;
		case "Plain":
			const atChain = parserQQMessage(msg.text);
			bridgeMessage.chain.push(...atChain);
			break;
		case "At":
			const memberInfo = await BotService.qqBot.mirai.api.memberInfo(bridgeMessage.bridge.qqGroup, msg.target) as MiraiConfig.MemberInfo;
			const atQq = MessageUtil.AtQQ(memberInfo.name, msg.target);
			bridgeMessage.chain.push(atQq);
			break;
		case "AtAll":
			bridgeMessage.chain.push(MessageUtil.AtAll());
			break;
		case "Face":
			bridgeMessage.chain.push(MessageUtil.Plain(`QQ表情:[Face=${msg.faceId},${msg.name}]`));
			break;
		case "Image":
			const filePath = await download(msg.url);
			const img = MessageUtil.Image(msg.url);
			img.local = filePath;
			bridgeMessage.chain.push(img);
			break;
			// case 'Xml':
			// 	messageContent += await handlerXml(msg);
			// 	break;
			// case 'App':
			// 	const content = JSON.parse(msg.content) as any;
			// 	messageContent += `> ** ${content.prompt} **\n`
			// 	messageContent += `> ${content.meta.detail_1.desc}\n`
			// 	messageContent += `> ${content.meta.detail_1.qqdocurl}\n`
			// 	break;
		default:
			bridgeMessage.chain.push(MessageUtil.Plain(JSON.stringify(msg)));
		}
	}
}

/**
 * BridgeMessage 发送到 QQ
 */
export async function bridgeSendQQ(bridgeMessage: BridgeMessage) {
	const bridge = bridgeMessage.bridge;
	if (!bridge.qqGroup) {
		return;
	}
	try {
		bridgeMessage.chain.unshift(MiraiMessage.Plain(toBridgeUserName({
			...bridgeMessage.author,
			source: bridgeMessage.source,
		}) + "\n"));
		const chain: MessageType.MessageChain = [];
		let quote: string;
		for (const msg of bridgeMessage.chain) {
			switch (msg.type) {
			case "At":
				if (msg.source === "QQ") {
					chain.push(MiraiMessage.At(msg.qqNumber));
				} else {
					chain.push(MessageUtil.Plain(toBridgeUserName({...msg})));
				}
				break;
			case "Image":
				if (msg.local) {
					const relativePath = path.relative(path.join(__dirname, "../mcl/data/net.mamoe.mirai-api-http/images"), msg.local);
					chain.push(MiraiMessage.Image(null, null, relativePath));
				} else {
					chain.push(MiraiMessage.Image(null, msg.cache || msg.url));
				}
				break;
			case "Plain":
			case "AtAll":
				chain.push(msg);
				break;
			default:
				chain.push(MessageUtil.Plain(JSON.stringify(msg)));
			}
		}
		if (bridgeMessage.author.avatar) {
			const avatar = await generateQQMsgContentAvatar(bridgeMessage.author.avatar);
			chain.unshift(avatar);
		}
		if (bridgeMessage.quoteMessage?.from?.qqMessageID) {
			quote = bridgeMessage.quoteMessage.from.qqMessageID;
		} else if (bridgeMessage.quoteMessage) {
			let replyMessageContent = "";
			for (const msg of bridgeMessage.quoteMessage.chain) {
				switch (msg.type) {
				case "At":
					replyMessageContent += toBridgeUserName({...msg});
					break;
				case "Image":
					replyMessageContent += "[图片]";
					break;
				case "Plain":
					replyMessageContent += msg.text;
					break;
				case "AtAll":
					replyMessageContent += "[@所有人]";
					break;
				default:
					replyMessageContent += `[${JSON.stringify(msg)}]`;
				}
			}
			chain.unshift(MessageUtil.Plain(replyMessageContent.split("\n").map((str) => "> " + str).join("\n") + "\n"));
			const at: At = {
				type: "At",
				source: bridgeMessage.quoteMessage.source,
				...bridgeMessage.quoteMessage.author
			};
			chain.unshift();
			const userHead: MessageType.SingleMessage[] = [
				MessageUtil.Plain("> 回复 "),
				toQQUser(at),
				MessageUtil.Plain(" 的消息\n")
			];
			chain.unshift(...userHead);
		}
		const resultMessage = await BotService.qqBot.mirai.api.sendGroupMessage(chain, bridgeMessage.bridge.qqGroup, parseInt(quote));
		bridgeMessage.from.qqMessageID = resultMessage.messageId.toString();
	} catch (e) {
		let quote: string;
		if (bridgeMessage.quoteMessage?.from?.qqMessageID) {
			quote = bridgeMessage.quoteMessage.from.qqMessageID;
		}
		const resultMessage = await BotService.qqBot.mirai.api.sendGroupMessage(JSON.stringify(bridgeMessage.chain), bridgeMessage.bridge.qqGroup, parseInt(quote));
		bridgeMessage.from.qqMessageID = resultMessage.messageId.toString();

	}
}

/**
 * at 转成 at QQ用户格式
 */
function toQQUser(msg: At): MessageType.At | MessageType.Plain {
	if (msg.source === "QQ") {
		return MiraiMessage.At(msg.qqNumber);
	} else {
		return MessageUtil.Plain(toBridgeUserName({...msg}));
	}
}

/**
 * BridgeMessage 发送到 Discord
 */
export async function bridgeSendDiscord(bridgeMessage: BridgeMessage) {
	const bridge = bridgeMessage.bridge;
	if (!bridge.discord || !bridge.discord.id || !bridge.discord.token || !bridge.discord.channelID) {
		return;
	}
	try {
		const option: WebhookMessageOptions = {
			username: toBridgeUserName({...bridgeMessage.author, source: bridgeMessage.source}).replace(/^@/, ""),
			avatarURL: bridgeMessage.author.avatar,
			files: [],
			embeds: [],
		};
		// 获取webhook
		const webhook = await BotService.discord.fetchWebhook(bridgeMessage.bridge.discord.id, bridgeMessage.bridge.discord.token);
		// 处理消息
		let messageContent = "";
		for (const msg of bridgeMessage.chain) {
			switch (msg.type) {
			case "Plain":
				messageContent += msg.text;
				break;
			case "At":
				messageContent += await toDiscordAtUser(msg, webhook);
				break;
			case "Image":
				const url = msg.local || msg.cache || msg.url;
				const attr = new MessageAttachment(url);
				option.files.push(attr);
				break;
			case "AtAll":
				messageContent += "@everyone";
				break;
			default:
				messageContent += JSON.stringify(msg);
			}
		}
		// !直接回复
		// const channel: any = await BotService.discord.channels.fetch(webhook.channelID);
		// if (bridgeMessage.quoteMessage && bridgeMessage.quoteMessage.from) {
		// 	const replyMsg: DiscordMessage = await channel.messages.fetch(bridgeMessage.quoteMessage.from.dcMessageID);
		// 	const resultMessage = await replyMsg.reply(messageContent, option) as DiscordMessage;
		// 	bridgeMessage.from.dcMessageID = resultMessage.id;
		// }
		// 使用embed回复
		// const embed = new MessageEmbed({author: {name: '@[QQ] rabbitkiller(243249439)'}});
		// embed.description = messageContent;
		// option.embeds.push(embed);
		if (bridgeMessage.quoteMessage) {
			const message = await toDiscordQuoteMessage(bridgeMessage.quoteMessage, webhook);
			messageContent = message + "\n" + messageContent;
			const at: At = {
				type: "At",
				source: bridgeMessage.quoteMessage.source,
				...bridgeMessage.quoteMessage.author
			};
			messageContent = `> 回复 ${await toDiscordAtUser(at, webhook)} 的消息\n` + messageContent;
		}
		const resultMessage = await webhook.send(messageContent, option) as DiscordMessage;
		bridgeMessage.from.dcMessageID = resultMessage.id;
	} catch (err) {
		log.error(err);
		const option: WebhookMessageOptions = {
			username: toBridgeUserName({...bridgeMessage.author, source: bridgeMessage.source}).replace(/^@/, ""),
			avatarURL: bridgeMessage.author.avatar,
			files: [],
			embeds: [],
		};
		const webhook = await BotService.discord.fetchWebhook(bridgeMessage.bridge.discord.id, bridgeMessage.bridge.discord.token);
		const resultMessage = await webhook.send(JSON.stringify(bridgeMessage.chain), option) as DiscordMessage;
		bridgeMessage.from.dcMessageID = resultMessage.id;
	}
}

// 转换成回复消息
async function toDiscordQuoteMessage(bridgeMessage: BridgeMessage, webhook: DiscordWebhook): Promise<string> {
	let messageContent = "";
	for (const msg of bridgeMessage.chain) {
		switch (msg.type) {
		case "Plain":
			messageContent += msg.text;
			break;
		case "At":
			messageContent += `${await toDiscordAtUser(msg, webhook)}`;
			break;
		case "AtAll":
			messageContent += "\\@everyone";
			break;
		default:
			messageContent += JSON.stringify(msg);
		}
	}
	return messageContent.split("\n").map((str) => "> " + str).join("\n");
}

/**
 * at 转成 at Discord用户格式
 */
async function toDiscordAtUser(at: At, webhook: DiscordWebhook): Promise<string> {
	if (at.source === "DC") {
		// 获取guild, 在通过guild获取所有用户
		const guild: Guild = await BotService.discord.guilds.fetch(webhook.guildID);
		const fetchedMembers = await guild.members.fetch();
		const member = fetchedMembers.find(member => member.user.discriminator === at.discriminator && (member.nickname === at.username || member.user.username === at.username));
		if (member) {
			return `<@!${member.user.id}>`;
		}
	}
	return toBridgeUserName(at);
}

/**
 * BridgeMessage 发送到 开黑啦
 */
export async function bridgeSendKaiheila(bridgeMessage: BridgeMessage) {
	if (!bridgeMessage.bridge.kaiheila || !bridgeMessage.bridge.kaiheila.channelID) {
		return;
	}
	try {
		const chain: Array<KhlInterface.KMarkdown | KhlInterface.ImageGroup> = [];
		// 处理消息
		for (const msg of bridgeMessage.chain) {
			switch (msg.type) {
			case "Plain":
				await insertKhlChain("plain", msg.text, chain);
				break;
			case "At":
				if (msg.source === "KHL") {
					const channel = await BotService.kaiheila.API.channel.view(bridgeMessage.bridge.kaiheila.channelID);
					const memberList = await BotService.kaiheila.API.guild.userList(channel.guildId, channel.id, msg.username);
					const member = memberList.items.find(member => (member.nickname === msg.username || member.username === msg.username) && member.identifyNum === msg.discriminator);
					if (member) {
						await insertKhlChain("plain", `(met)${member.id}(met)`, chain);
						break;
					}
				}
				await insertKhlChain("plain", toBridgeUserName(msg), chain);
				break;
			case "Image":
				const cache = await remoteImageToLocal(msg.url);
				await insertKhlChain("image", cache, chain);
				break;
			case "AtAll":
				await insertKhlChain("plain", "(met)all(met)", chain);
				break;
			default:
				await insertKhlChain("plain", JSON.stringify(msg), chain);
			}
		}
		const avatar = await remoteImageToLocal(bridgeMessage.author.avatar);

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
							"content": toBridgeUserName({...bridgeMessage.author, source: bridgeMessage.source}),
						},
						"mode": "left",
						"accessory": {
							"type": "image",
							// 'src': 'https://img.kaiheila.cn/assets/2021-01/7kr4FkWpLV0ku0ku.jpeg',
							"src": avatar,
							"size": "sm",
							"circle": true,
						},
					},
					...chain,
					// {
					// 	'type': 'section',
					// 	'text': {
					// 		'type': 'kmarkdown',
					// 		'content': messageContent,
					// 	},
					// },
				],
			},
		]);

		let rei = 0;
		const promise = new Promise<void>((resolve, reject) => {
			async function send(): Promise<void> {
				rei++;
				const resultMessage = await BotService.kaiheila.API.message.create(KaiheilaBotRoot.MessageType.card, bridgeMessage.bridge.kaiheila.channelID, msgText);
				bridgeMessage.from.khlMessageID = resultMessage.msgId;
				resolve();
			}

			send().then(() => {
			}, (err) => {
				if (rei > 3) {
					reject(err);
					return;
				}
				send();
			});
		});
		await promise;
	} catch (e) {
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
							"content": toBridgeUserName({...bridgeMessage.author, source: bridgeMessage.source}),
						},
						"mode": "left",
						// 'accessory': {
						// 'type': 'image',
						// 'src': 'https://img.kaiheila.cn/assets/2021-01/7kr4FkWpLV0ku0ku.jpeg',
						// 'src': avatar,
						// 'size': 'sm',
						// 'circle': true,
						// },
					},
					{
						"type": "section",
						"text": {
							"type": "kmarkdown",
							"content": JSON.stringify(bridgeMessage.chain),
						},
					},
				],
			},
		]);
		const resultMessage = await BotService.kaiheila.API.message.create(KaiheilaBotRoot.MessageType.card, bridgeMessage.bridge.kaiheila.channelID, msgText);
		bridgeMessage.from.khlMessageID = resultMessage.msgId;
	}
}

async function insertKhlChain(type: "image" | "plain", text: string, chain: Array<KhlInterface.KMarkdown | KhlInterface.ImageGroup>) {
	let last = chain[chain.length - 1];
	if (type === "image") {
		if (!last || last.type !== "image-group") {
			last = {type: "image-group", elements: []};
			chain.push(last);
		}
		last.elements.push({type: "image", src: text, size: "lg"});
	} else {
		if (!last || last.type !== "section") {
			last = {type: "section", text: {type: "kmarkdown", content: ""}};
			chain.push(last);
		}
		last.text.content += text;
	}

}

/**
 * 用户信息统一字符名称
 */
function toBridgeUserName(author: {
	source: "QQ" | "KHL" | "DC",
	username: string,
	qqNumber?: number,
	discriminator?: string
}): string {
	if (author.source === "QQ") {
		return `@[QQ] ${author.username}(${author.qqNumber})`;
	} else if (author.source === "KHL") {
		return `@[KHL] ${author.username}#${author.discriminator}`;
	} else {
		return `@[DC] ${author.username}#${author.discriminator}`;
	}
}

/**
 * 解析 qq 文本消息
 */
export function parserQQMessage(message: string): Array<At | Plain> {
	const ast = markdownEngine.parserFor({
		atDC: bridgeRule.atDC,
		atQQ: bridgeRule.atQQ,
		atKHL: bridgeRule.atKHL,
		Plain: bridgeRule.Plain,
	})(message);
	const length = ast.length;
	for (let i = length - 1; i > length - 3; i--) {
		const chain = ast[i];
		if (chain.type === "Plain" && chain.text === "\n") {
			ast.pop();
		}
	}
	return ast as any;
}

/**
 * 解析 Discord 文本消息
 */
export async function parserDCMessage(message: string, bridgeMessage: BridgeMessage): Promise<Array<At | AtAll | Plain | Image>> {
	const result: Array<At | AtAll | Plain | Image> = [];
	const ast = markdownEngine.parserFor({
		atDC: bridgeRule.atDC,
		atQQ: bridgeRule.atQQ,
		atKHL: bridgeRule.atKHL,
		discordUser: bridgeRule.discordUser,
		discordEveryone: bridgeRule.discordEveryone,
		discordHere: bridgeRule.discordHere,
		discordEmoji: bridgeRule.discordEmoji,
		Plain: bridgeRule.Plain,
	})(message) as Array<{ type: "discordUser" | "discordEmoji", [prop: string]: any }>;
	for (const node of ast) {
		if (node.type === "discordEmoji") {
			result.push(MessageUtil.Image(`https://cdn.discordapp.com/emojis/${node.id}.${node.animated ? "gif" : "png"}`));
		} else if (node.type === "discordUser") {
			const user = bridgeMessage.origin.dcMessage.mentions.users.find(user => user.id === node.id);
			result.push(MessageUtil.AtDC(user.username, user.discriminator));
		} else {
			result.push(node as any);
		}
	}
	const length = result.length;
	for (let i = length - 1; i > length - 3; i--) {
		const chain = result[i];
		if (chain.type === "Plain" && chain.text === "\n") {
			result.pop();
		}
	}
	return result;
}

/**
 * 解析 开黑啦 文本消息
 */
export function parserKHLMessage(message: string): Array<At | AtAll | Plain> {
	// const result: Array<At | AtAll | Plain> = [];
	const ast = markdownEngine.parserFor({
		atDC: bridgeRule.atDC,
		atQQ: bridgeRule.atQQ,
		atKHL: bridgeRule.atKHL,
		khlEveryone: bridgeRule.khlEveryone,
		Plain: bridgeRule.Plain,
	})(message);
	const length = ast.length;
	for (let i = length - 1; i > length - 3; i--) {
		const chain = ast[i];
		if (chain.type === "Plain" && chain.text === "\n") {
			ast.pop();
		}
	}
	return ast as any;
}

/**
 * 保存统一消息关联关系
 */
export async function saveBridgeMessage(bridgeMessage: BridgeMessage) {
	const messageEntityRepository = DatabaseService.connection.getRepository(BridgeMessageEntity);
	return messageEntityRepository.save(bridgeMessage.from);
}
