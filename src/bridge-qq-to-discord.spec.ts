import bridgeDiscordToQQ, {handlerAt, parseEmoji} from './bridge-discord-to-qq';
import {Client, Intents} from "discord.js";
import {App} from 'koishi-test-utils';
import config from '../koishi.config';

describe('bridge-discord-to-qq.spec.ts', () => {
  beforeAll(async ()=>{
    // 需要Intents允许一些行为(要获取频道的用户必须需要)
    const intents = new Intents([
      Intents.NON_PRIVILEGED, // include all non-privileged intents, would be better to specify which ones you actually need
      "GUILD_MEMBERS", // lets you request guild members (i.e. fixes the issue)
    ]);
    const discord = new Client({ ws: { intents } });
    const koishi = new App(config);
    await bridgeDiscordToQQ({discord: discord, koishi: koishi});
  });
  it('parseEmoji', async () => {
  });
  it('handlerAt', async () => {
  });
});
