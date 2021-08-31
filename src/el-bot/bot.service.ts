import { default as Bot } from "el-bot";
import config from '../config';
import { Client, Intents } from 'discord.js';
import * as KaiheilaBotRoot from 'kaiheila-bot-root';
import { KaiheilaBotInterface } from 'kaiheila-bot-root/dist/types/common';
import { BotInstance } from 'kaiheila-bot-root/dist/BotInstance';
import * as log from "../utils/log5";

class _ElAndDiscordService {
  discord: Client;
  qqBot: Bot;
  kaiheila: BotInstance & KaiheilaBotInterface;

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

      discord.once('ready', () => {
        resolve(discord);
      });
      loginDiscord();
    })
  }

  async initKaiheila() {
    return new Promise(((resolve, reject) => {
      const bot = this.kaiheila = new KaiheilaBotRoot.KaiheilaBot({mode: 'websocket', token: config.kaiheilaBotToken, ignoreDecryptError: false});
      bot.connect();
      resolve(this.kaiheila);
    }))
  }
}

export const BotService = new _ElAndDiscordService();
