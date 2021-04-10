import "reflect-metadata";
import 'koishi-adapter-cqhttp';
import * as log from './src/utils/log5';
import bridgeQQToDiscord from './src/bridge-qq-to-discord';
import bridgeDiscordToQQ from './src/bridge-discord-to-qq';
import {DatabaseService} from "./src/database.service";
import {KoishiAndDiscordService} from "./src/koishiAndDiscord.service";


async function main() {
    await DatabaseService.init();
    log.message('🌈', `数据库连接成功`);
    await KoishiAndDiscordService.initQQBot();
    log.message('🌈', `QQ 成功连接`);
    await KoishiAndDiscordService.initDiscord();
    log.message('🌈', `Discord 成功登录 ${KoishiAndDiscordService.discord.user.tag}`);
    await bridgeQQToDiscord();
    await bridgeDiscordToQQ();
}

main().then()