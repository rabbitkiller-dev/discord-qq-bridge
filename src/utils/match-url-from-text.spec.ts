import { MatchUrlFromText } from "./match-url-from-text";
// import { longUrlIntoShotUrl } from "./longurl-into-shoturl";

describe("match-url-from-text.ts", () => {
	// beforeAll(async () => {});
	it("从文本获取url", async () => {
		expect(
			MatchUrlFromText(`[Discord] @カノープス・カリーナ#8351
https://twitter.com/nezumiironyanko/status/764859766657003521
`)
		).toStrictEqual(["https://twitter.com/nezumiironyanko/status/764859766657003521"]);

		expect(
			MatchUrlFromText(`https://mega.nz/file/heQzBYgS#15LiSBxJex7fHrUZZfniBhUSmtOd6FB6s-3tn0MC_iQ
`)
		).toStrictEqual(["https://mega.nz/file/heQzBYgS#15LiSBxJex7fHrUZZfniBhUSmtOd6FB6s-3tn0MC_iQ"]);

		expect(
			MatchUrlFromText(`https://rezero.fandom.com/zh/wiki/Special:用户贡献/Eisblumen
`)
		).toStrictEqual(["https://rezero.fandom.com/zh/wiki/Special:用户贡献/Eisblumen"]);

		expect(
			MatchUrlFromText(`比如https://rezero.fandom.com/zh/wiki/Special:用户贡献/Eisblumen
`)
		).toStrictEqual(["https://rezero.fandom.com/zh/wiki/Special:用户贡献/Eisblumen"]);

		expect(
			MatchUrlFromText(`比如https://rezero.fandom.com/zh/wiki/Special:用户贡献/Eisblumen 基本上磊asaldijoi12
`)
		).toStrictEqual(["https://rezero.fandom.com/zh/wiki/Special:用户贡献/Eisblumen"]);

		expect(
			MatchUrlFromText(`[Discord] @カノープス・カリーナ#8351
https://mypage.syosetu.com/mypageblog/view/userid/235132/blogkey/649383/
ddd
https://mypage.syosetu.com/aaaaa/
`)
		).toStrictEqual([
			"https://mypage.syosetu.com/mypageblog/view/userid/235132/blogkey/649383/",
			"https://mypage.syosetu.com/aaaaa/",
		]);
	});
});
