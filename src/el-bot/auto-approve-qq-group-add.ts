/**
 * 自动审批新成员进群
 */
// import { MessageType } from "mirai-ts";
import { BotService } from "./bot.service";
import config from "../config";

export async function autoApproveQQGroup() {
	BotService.qqBot.mirai.on("MemberJoinRequestEvent", (data) => {
		const flag = config.autoApproveQQGroup.find((s) => s.qqGroup === data.groupId);
		// 判断有没有配置自动审批
		if (!flag) {
			return;
		}
		if (data.message && new RegExp(flag.reg).test(data.message)) {
			data.respond(0);
		}
	});
}
