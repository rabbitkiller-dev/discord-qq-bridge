import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BridgeModule } from "./bridge/bridge.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
	imports: [
		BridgeModule,
		TypeOrmModule.forRoot(),
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, "..", "projects/ngx-admin-starter-kit/dist"),
		}),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
