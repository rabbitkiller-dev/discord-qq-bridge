import {App, CQCode} from 'koishi';
import 'koishi-adapter-cqhttp';
import * as fs from 'fs';
import * as mime from 'mime';
import * as path from 'path';
import * as pluginCommon from 'koishi-plugin-common';
import {Client, MessageAttachment} from 'discord.js';

import * as log from './utils/log5';
const {sysLog} = require('./utils/sysLog'); // sysLog 保存日志
import bridgeQqToDiscord from './bridge-qq-to-discord';
import bridgeDiscordToQq from './bridge-discord-to-qq';
import config from './koishi.config';
import {parse} from 'ts-node';

const discord = new Client();
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
        try {
            bridgeQqToDiscord({
                discord: discord,
                koishi: koishi,
            })
            bridgeDiscordToQq({
                discord: discord,
                koishi: koishi,
            })
        } catch (error) {
            log.error(error);
        }
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
