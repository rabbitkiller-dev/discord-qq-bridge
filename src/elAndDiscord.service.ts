import {default as Bot} from "el-bot";
import config from '../el.config';
import {Client, Intents} from 'discord.js';
import * as log from "../utils/log5";

class _ElAndDiscordService {
  discord: Client;
  qqBot: Bot;

  constructor() {
  }

  async initQQBot() {
    const qqBot = this.qqBot = new Bot({
      qq: config.qqBot,
      setting: config.setting,
    } as any);

    return await qqBot.start();
  }

  async initDiscord() {
    return new Promise((resolve, reject) => {
      // 需要Intents允许一些行为(要获取频道的用户必须需要)
      const intents = new Intents([
        Intents.NON_PRIVILEGED, // include all non-privileged intents, would be better to specify which ones you actually need
        "GUILD_MEMBERS", // lets you request guild members (i.e. fixes the issue)
      ]);
      const discord = this.discord = new Client({ws: {intents}});

      function loginDiscord() {
        discord.login(config.discordBotToken).then(() => {
        }, (err) => {
          log.message(err);
          log.message('🌈', `Discord 连接失败, 重新连接...`);
          loginDiscord();
        });
      }

      discord.on('ready', () => {
        try {
          resolve(discord)
        } catch (error) {
          reject(error);
        }
      });
      loginDiscord();
    })
  }
}

export const ElAndDiscordService = new _ElAndDiscordService();