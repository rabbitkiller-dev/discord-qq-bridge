// const Bot = require("el-bot");
import * as log from './src/utils/log5';

import {DatabaseService} from "./src/database.service";
import {ElAndDiscordService} from "./src/elAndDiscord.service";


import bridgeQQToDiscord from './src/bridge-qq-to-discord.el';
import bridgeDiscordToQQ from './src/bridge-discord-to-qq.el';

async function main() {
  await DatabaseService.init();
  log.message('🌈', `数据库连接成功`);
  await ElAndDiscordService.initQQBot();
  log.message('🌈', `QQ 成功连接`);
  await ElAndDiscordService.initDiscord();
  log.message('🌈', `Discord 成功登录 ${ElAndDiscordService.discord.user.tag}`);
  await bridgeQQToDiscord();
  await bridgeDiscordToQQ();
}

main().then()