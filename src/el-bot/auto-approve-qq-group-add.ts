/**
 * 自动审批新成员进群
 */
import {MessageType} from 'mirai-ts';
import { BotService } from './bot.service';

export async function autoApproveQQGroup() {
  BotService.qqBot.mirai.on('MemberJoinRequestEvent', (data) => {
    if(data.message && /.*[3三][天日].*/.test(data.message)){
      data.respond(0);
    }
  })
}
