import { parserMessageAt } from "./message-util";

describe("bridge-bridge-to-qq.bot.spec.ts", () => {
	beforeAll(async ()=>{
	});

	it("parseAt", async () => {
		console.log(parserMessageAt(`asdkjasd
    @[DC] rabbitkiller#7372 asdlkajdsa @[QQ] 夏のdevil•メイエル(1250226509)
 @[KHL] rabbitkiller(兔子)#7435 斯柯达斯柯达`));
	});

});
