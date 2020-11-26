import {App} from 'koishi';
import 'koishi-adapter-cqhttp';
import pluginCommon from 'koishi-plugin-common';
import {Client} from 'discord.js';

const {sysLog} = require('./utils/sysLog'); // sysLog 保存日志

import config from './koishi.config';
import {parse} from 'ts-node';

const discord = new Client();
/**
 * @instance app koishi实例
 */
const koishi = new App(config);

/**
 * @dependencies 添加 koishi 插件
 */
koishi.plugin(pluginCommon, { welcome: ''});
// koishi.plugin(require('koishi-plugin-chess'))
// koishi.plugin(require('koishi-plugin-mcping'));
// koishi.plugin(require('koishi-plugin-mysql'))
// koishi.plugin(require('koishi-plugin-image-search'));
// koishi.plugin(require('koishi-plugin-status'))

/**
 * @method koishi.start koishi启动完毕，登录discord
 */
koishi.start().then(() => {
  console.log(koishi.bots[0]);
  discord.on('ready', () => {
    sysLog('🌈', `Discord 成功登录 ${discord.user.tag}`)
  });

  /**
   * @module util-discord-to-qq
   */
  discord.on('message', msg => {
    if (msg.content === '!ping') {
      // send back "Pong." to the channel the message was sent in
      msg.channel.send('Pong.');
    }
    const send = [
      '[Discord] ' + msg.author.username + '#' + msg.author.discriminator,
      msg.content
    ].join('\n');
    sysLog(send);
    // 无视自己的消息
    if (msg.author.id === config.discordBot) {
      sysLog(`[Discord] discordBot: ${msg.content}`);
      return;
    }
    // 查询这个频道是否需要通知到群
    const bridge = config.bridges.find((opt) => opt.discordChannel === msg.channel.id);
    if (!bridge) {
      return;
    }
    koishi.bots[0].sendGroupMsg(bridge.qqGroup, send);
    sysLog('⇿', 'Discord信息已推送到QQ', msg.author.username + '#' + msg.author.discriminator, msg.content)
  });
  discord.on('shardError', error => {
    console.error('A websocket connection encountered an error:', error);
  });
  discord.login('NzgxMTkzMjUyMDk0NDc2MzYw.X76E6Q.TOkL9MG4JOdb5vsIcUo0nyLPCrc');

  koishi.on('message', msg => {
    const send = [
      '[QQ] ' + msg.sender.nickname,
      msg.message
    ].join('\n');
    const bridge = config.bridges.find((bridge) => bridge.qqGroup === msg.groupId);
    if (!bridge) {
      return;
    }
    discord.channels.fetch(bridge.discordChannel).then((channel) => {
        channel.shard.send()
    });
    sysLog('⇿', 'QQ信息已推送到Discord', msg.sender.nickname, msg.message)
  });
  /** @end */
  sysLog('🌈', 'koishi进程重新加载')
});
