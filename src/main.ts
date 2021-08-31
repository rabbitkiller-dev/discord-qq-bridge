import "reflect-metadata";
import * as log from './utils/log5';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseService } from "./database.service";
import { BotService } from './el-bot/bot.service';
import { autoApproveQQGroup } from './el-bot/auto-approve-qq-group-add';
import bridgeQq from './el-bot/bridge-qq';
import bridgeDiscord from './el-bot/bridge-discord';
import bridgeKai from './el-bot/bridge-kaiheila';


async function main() {
  await DatabaseService.init();
  log.message('🌈', `数据库连接成功`);
  await BotService.initQQBot();
  log.message('🌈', `QQ 成功连接`);
  await BotService.initDiscord();
  log.message('🌈', `Discord 成功登录 ${BotService.discord.user.tag}`);
  await BotService.initKaiheila();
  log.message('🌈', `开黑啦 成功登录`);
  // log.message('🌈', `开黑啦 成功登录 ${(await BotService.kaiheila.users.me()).username}`);
  // 桥
  await bridgeQq();
  await bridgeDiscord();
  await bridgeKai();
  // qq群自动审批
  await autoApproveQQGroup();
}

main().then()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  log.message('🌈', `服务器监听:3000`);
  await app.listen(3000);
}

bootstrap();
