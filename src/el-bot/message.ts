/**
 * 生成对应消息格式
 * @packageDocumentation
 */
import { Plain, At, AtAll, Image } from "./interface";

/**
 * 生成艾特默认的消息格式
 * @param target QQ 号
 */
function AtQQ(username: string, qqNumber: number): At {
	return {
		type: "At",
		source: "QQ",
		username,
		qqNumber,
	};
}

/**
 * 生成艾特默认的消息格式
 * @param target QQ 号
 */
function AtKHL(username: string, discriminator: string): At {
	return {
		type: "At",
		source: "KHL",
		username: username,
		discriminator: discriminator,
	};
}
/**
 * 生成艾特默认的消息格式
 * @param target QQ 号
 */
function AtDC(username: string, discriminator: string): At {
	return {
		type: "At",
		source: "DC",
		username: username,
		discriminator: discriminator,
	};
}

/**
 * 生成艾特全体成员的消息格式
 */
function AtAll(): AtAll {
	return {
		type: "AtAll",
	};
}


/**
 * 生成文本消息格式
 * @param text 文本
 */
function Plain(text: string): Plain {
	return {
		type: "Plain",
		text,
	};
}

/**
 * 生成图片消息格式
 */
function Image(url: string): Image {
	return {
		type: "Image",
		url,
	};
}

export const MessageUtil = {
	AtQQ,
	AtKHL,
	AtDC,
	AtAll,
	Plain,
	Image,
};
