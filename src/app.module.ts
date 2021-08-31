import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { BridgeModule } from './bridge/bridge.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [BridgeModule, TypeOrmModule.forRoot()],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
}
