import {App, CQCode} from 'koishi';
import 'koishi-adapter-cqhttp';
import * as fs from 'fs';
import * as mime from 'mime';
import * as path from 'path';
import * as pluginCommon from 'koishi-plugin-common';
import {Client, Intents, MessageAttachment} from 'discord.js';

const {sysLog} = require('./utils/sysLog'); // sysLog 保存日志

import config from './koishi.config';
import {parse} from 'ts-node';

// 需要Intents允许一些行为(要获取频道的用户必须需要)
const intents = new Intents([
    Intents.NON_PRIVILEGED, // include all non-privileged intents, would be better to specify which ones you actually need
    "GUILD_MEMBERS", // lets you request guild members (i.e. fixes the issue)
]);
const discord = new Client({ ws: { intents } });
const koishi = new App(config);

/**
 * @dependencies 添加 koishi 插件
 */
koishi.plugin(pluginCommon, {welcome: ''});
// koishi.plugin(require('koishi-plugin-chess'))
// koishi.plugin(require('koishi-plugin-mcping'));
// koishi.plugin(require('koishi-plugin-mysql'))
// koishi.plugin(require('koishi-plugin-image-search'));
// koishi.plugin(require('koishi-plugin-status'))

/**
 * @method koishi.start koishi启动完毕，登录discord
 */
koishi.start().then(async () => {
  function loginDiscord() {
    discord.login(config.discordBotToken).then(() => {
      console.log('成功')
    }, (err) => {
      console.log(err);
      console.log('失败');
      loginDiscord();
    });
  }

  discord.on('ready', () => {
    sysLog('🌈', `Discord 成功登录 ${discord.user.tag}`);
    init();
  });

  /**
   * @module util-discord-to-qq
   */
  discord.on('shardError', error => {
    console.error('A websocket connection encountered an error:', error);
  });
  discord.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
  });
  loginDiscord();
  /** @end */
  sysLog('🌈', 'koishi进程重新加载')
});

function init() {
  sysLog('🌈', 'koishi进程重新加载');
  // discord
  discord.on('message', async (msg) => {
    console.log(msg);
    if (msg.content === '!ping') {
      // send back "Pong." to the channel the message was sent in
      msg.channel.send('Pong.');
    }
    sysLog(`[Discord Start] `);
    sysLog(`[author.id=${msg.author.id}] [channel.id=${msg.channel.id}] [username=${msg.author.username + '#' + msg.author.discriminator}]`);
    sysLog(`[content=${msg.content}]`);
    sysLog(`[Discord End]`);
    // 无视自己的消息
    if (msg.author.id === config.discordBot) {
      return;
    }
    // 查询这个频道是否需要通知到群
    const bridge = config.bridges.find((opt) => opt.discordChannel === msg.channel.id);
    if (!bridge) {
      return;
    }
    const temps: any[] = [
      '[Discord] ' + msg.author.username + '#' + msg.author.discriminator
    ];
    // 没有内容时不处理
    if (msg.content.trim()) {
      temps.push(msg.content);
    }
    if (msg.attachments.size > 0) {
      const attachments = msg.attachments.array();
      for (let attachment of attachments) {
        temps.push(CQCode.stringify('image', { file: attachment.url }))
      }
    }
    if (temps.length > 1) {
      koishi.bots[0].sendGroupMsg(bridge.qqGroup, temps.join('\n')).then(() => {
        sysLog('⇿', 'Discord信息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
      });
    } else {
      temps.push('不支持该消息');
      koishi.bots[0].sendGroupMsg(bridge.qqGroup, temps.join('\n')).then(() => {
        sysLog('⇿', 'Discord信息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
      });
    }
  });
  // koishi
  koishi.group(...config.bridges.map(b => b.qqGroup)).on('message', msg => {
    const bridge = config.bridges.find((bridge) => bridge.qqGroup === msg.groupId);
    if (!bridge) {
      return;
    }
    const send = CQCode.parseAll(msg.message).map((msg) => {
      if (typeof msg === 'string') {
        return msg;
      } else if (msg.type === 'image') {
        const attr = new MessageAttachment(msg.data.url);
        attr.setName('temp.png');
        return attr;
      }
    });
    discord.channels.fetch(bridge.discordChannel).then(async (channel: any) => {
      await channel.send(`[QQ] ${msg.sender.nickname}`);
      for (const msg of send) {
        await channel.send(msg);
      }
      sysLog('⇿', 'QQ信息已推送到Discord', msg.sender.nickname, msg.message)
    });
  });
}
