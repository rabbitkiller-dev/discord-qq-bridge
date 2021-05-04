// const Bot = require("el-bot");
import * as log from './src/utils/log5';

import {DatabaseService} from "./src/database.service";
import {BotService} from "./src/el-bot/bot.service";


import bridgeQQToDiscord from './src/bridge-qq-to-discord.el';
import bridgeDiscordToQQ from './src/bridge-discord-to-qq.el';

async function main() {
  await DatabaseService.init();
  log.message('🌈', `数据库连接成功`);
  await BotService.initQQBot();
  log.message('🌈', `QQ 成功连接`);
  await BotService.initDiscord();
  log.message('🌈', `Discord 成功登录 ${BotService.discord.user.tag}`);
  await bridgeQQToDiscord();
  await bridgeDiscordToQQ();
}

main().then()
