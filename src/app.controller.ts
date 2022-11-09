import { Body, Controller, Get, Post, Req, Res, Request } from "@nestjs/common";
import { AppService } from "./app.service";
import { Response } from "express";
import config from "./config";
import { assetsCacheDir, download } from "./utils/download-file";

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Post("/api/remoteImageToLocal")
	async remoteImageToLocal(@Body() body: { url: string; useCache: boolean }, @Res() res: Response) {
		const filepath = await download(body.url, body.useCache);
		res.status(200).json({
			data: filepath
				.replace(assetsCacheDir, `${config.myDomainName}/api/cache`)
				.replace(/\\/g, "/"),
		});
	}

	@Get("/api/cache/**")
	async getImage(@Req() req: Request, @Res() res: Response) {
		console.log(req.url);
		const localFile = req.url.replace("/api/cache", assetsCacheDir);
		res.download(localFile);
	}
}
