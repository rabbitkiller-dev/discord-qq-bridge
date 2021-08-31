import { Body, Controller, Delete, Get, Param, Post, Redirect, Req, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { DToQUserLimitEntity } from '../entity/dToQ-user-limit.entity';
import { Repository } from 'typeorm';
import * as shortid from 'shortid';
import { BotService } from '../el-bot/bot.service';
import config, { Config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

@Controller('/api/bridge')
export class BridgeController {
  constructor(@InjectRepository(DToQUserLimitEntity)
              private dToQUserLimitRepository: Repository<DToQUserLimitEntity>) {
  }

  /**
   * 获取服务器配置
   */
  @Get('config')
  getBridgeConfig(@Res() res: Response) {
    res.status(200).json({data: config});
  }
  /**
   * 保存服务器配置
   */
  @Post('config')
  saveBridgeConfig(@Body() body: Config, @Res() res: Response) {
    config.autoApproveQQGroup = body.autoApproveQQGroup;
    fs.writeFileSync(path.join(__dirname, '../../config.json'), JSON.stringify(config, undefined, '  '));
    res.status(200).json({data: config});
  }

  /**
   * 获取Discord所有伺服guilds
   */
  @Get('guilds')
  getAllGuilds(@Res() res: Response) {
    const channels: Array<{ id: string, name: string }> = []
    BotService.discord.guilds.cache.forEach((value, key, map) => {
      channels.push({id: key, name: value.name})
    })
    res.status(200).json({data: channels});
  }

  /**
   * 获取Discord伺服guild所有的频道
   */
  @Get('guilds/:guildID/channels')
  async getAllChannels(@Param('guildID') guildID: string, @Res() res: Response) {
    const channels: Array<{ id: string, name: string }> = []
    BotService.discord.guilds.cache.get(guildID).channels.cache.forEach((value, key, map) => {
      channels.push({id: key, name: value.name})
    })
    res.status(200).json({data: channels});
  }

  /**
   * 获取Discord伺服guild所有的用户
   */
  @Get('guilds/:guildID/users')
  async getAllUsers(@Param('guildID') guildID: string, @Res() res: Response) {
    const users: Array<{ id: string, username: string, discriminator: string, bot: boolean }> = []
    const fetchedMembers = await BotService.discord.guilds.cache.get(guildID).members.fetch()
    BotService.discord.guilds.cache.get(guildID).members.cache.forEach((value, key, map) => {
      users.push({id: key, username: value.user.username, discriminator: value.user.discriminator, bot: value.user.bot})
    })
    res.status(200).json({data: users});
  }

  /**
   * 获取对应伺服的限制同步信息
   */
  @Get('guilds/:guildID/DToQUserLimit')
  async getAllDToQUserLimit(@Param('guildID') guildID: string, @Res() res: Response) {
    const results = await this.dToQUserLimitRepository.find({guild: guildID});
    res.status(200).json({data: results});
  }

  /**
   * 保存对应伺服的限制同步信息
   */
  @Post('DToQUserLimit')
  async postAllDToQUserLimit(@Body() body: DToQUserLimitEntity, @Res() res: Response) {
    const result = await this.dToQUserLimitRepository.save(body);
    res.status(200).json({data: result});
  }

  /**
   * 删除对应伺服的限制同步信息
   */
  @Delete('DToQUserLimit/:id')
  async deleteAllDToQUserLimit(@Param('id') id: string, @Res() res: Response) {
    const result = await this.dToQUserLimitRepository.delete(id)
    res.status(200).json({data: result});
  }


}
