import {App, CQCode} from 'koishi';
import "reflect-metadata";
import 'koishi-adapter-cqhttp';
import * as fs from 'fs';
import * as mime from 'mime';
import * as path from 'path';
import * as pluginCommon from 'koishi-plugin-common';
import * as imageSearch from './packages/plugin-image-search/src';
import {Client, Intents, MessageAttachment} from 'discord.js';

import * as log from './utils/log5';

const {sysLog} = require('./utils/sysLog'); // sysLog 保存日志
import bridgeQqToDiscord from './src/bridge-qq-to-discord';
import bridgeDiscordToQq from './src/bridge-discord-to-qq';
import config from './koishi.config';
import {DatabaseService} from "./src/database.service";

// 需要Intents允许一些行为(要获取频道的用户必须需要)
const intents = new Intents([
  Intents.NON_PRIVILEGED, // include all non-privileged intents, would be better to specify which ones you actually need
  "GUILD_MEMBERS", // lets you request guild members (i.e. fixes the issue)
]);
const discord = new Client({ws: {intents}});
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
  await DatabaseService.init();
  console.log('启动成功');
});

config.imageSearch.forEach((conf) => {
  if (conf.type === 'qq') {
      console.log(`启动搜图: ${conf.type}:${conf.qqGroup}`)
      koishi.group(conf.qqGroup).plugin(imageSearch, {});
  }
});
