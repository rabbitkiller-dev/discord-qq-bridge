import "reflect-metadata";
import 'koishi-adapter-cqhttp';
import * as log from './utils/log5';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import bridgeQQToDiscord from './bridge-qq-to-discord';
import bridgeDiscordToQQ from './bridge-discord-to-qq';
import {DatabaseService} from "./database.service";
import {KoishiAndDiscordService} from "./koishiAndDiscord.service";


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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  log.message('🌈', `服务器监听:3000`);
  await app.listen(3000);
}
bootstrap();
