import * as KaiheilaBotRoot from 'kaiheila-bot-root';

export interface KaiheilaAllMessage {
  type: string,
  data: {
    type: KaiheilaBotRoot.MessageType,
    msgId: string,
    authorId: string,
    channelId: string
    guildId: string;
    author: KaiheilaBotRoot.UserInGuild
    quote: {
      type: KaiheilaBotRoot.MessageType;
      msgId: string;
      content: string;
      author: KaiheilaBotRoot.UserInGuild
    }
  }
}

/**
 * FriendMessage | GroupMessage | TempMessage 下的 MessageChain 中的单条消息类型
 * 单条消息 此处命名与 mamoe/mirai-core 保持一致
 */
export type SingleMessage =
  | Plain
  | At
  | AtAll
  | Image;

interface BaseSingleMessage {
  type: string;
}

/**
 * 文本消息
 */
export interface Plain extends BaseSingleMessage {
  type: "Plain";
  /**
   * 文字消息
   */
  text: string;
}

/**
 * 艾特全体成员消息
 */
export interface At extends BaseSingleMessage {
  type: "At";
  source: 'QQ' | 'KHL' | 'DC';
  username: string,
  qqNumber?: number,
  discriminator?: string,
}


/**
 * 艾特全体成员消息
 */
export interface AtAll extends BaseSingleMessage {
  type: "AtAll";
}

export interface Image extends BaseSingleMessage {
  type: 'Image';
  url: string; // 图片路径
  local?: string; // 图片本地路径
  cache?: string; // 图片缓存路径(bridge.rabbitkiller.dev的访问路径)
}
