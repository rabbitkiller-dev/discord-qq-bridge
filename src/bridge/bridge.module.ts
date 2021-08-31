import { Module } from '@nestjs/common';
import { BridgeController } from './bridge.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DToQUserLimitEntity } from '../entity/dToQ-user-limit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DToQUserLimitEntity])],
  controllers: [BridgeController]
})
export class BridgeModule {
}
