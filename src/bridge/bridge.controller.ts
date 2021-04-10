import { Body, Controller, Delete, Get, Param, Post, Redirect, Req, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { DToQUserLimitEntity } from '../entity/dToQ-user-limit.entity';
import { Repository } from 'typeorm';
import * as shortid from 'shortid';
import { KoishiAndDiscordService } from '../koishiAndDiscord.service';

@Controller('/api/bridge')
export class BridgeController {
  constructor(@InjectRepository(DToQUserLimitEntity)
              private dToQUserLimitRepository: Repository<DToQUserLimitEntity>) {
  }
  @Get('guilds')
  getAllGuilds(@Res() res: Response) {
    const channels: Array<{id: string, name: string}> = []
    KoishiAndDiscordService.discord.guilds.cache.forEach((value, key, map)=>{
      channels.push({id: key, name: value.name})
    })
    res.status(200).json({ data: channels });
  }

  @Get('guilds/:guildID/channels')
  async getAllChannels(@Param('guildID') guildID: string, @Res() res: Response) {
    const channels: Array<{id: string, name: string}> = []
    KoishiAndDiscordService.discord.guilds.cache.get(guildID).channels.cache.forEach((value, key, map)=>{
      channels.push({id: key, name: value.name})
    })
    res.status(200).json({ data: channels });
  }

  @Get('guilds/:guildID/users')
  async getAllUsers(@Param('guildID') guildID: string, @Res() res: Response) {
    const users: Array<{id: string, username: string, discriminator: string, bot: boolean}> = []
    const fetchedMembers = await KoishiAndDiscordService.discord.guilds.cache.get(guildID).members.fetch()
    KoishiAndDiscordService.discord.guilds.cache.get(guildID).members.cache.forEach((value, key, map)=>{
      users.push({id: key, username: value.user.username, discriminator: value.user.discriminator, bot: value.user.bot})
    })
    res.status(200).json({ data: users });
  }

  @Get('guilds/:guildID/DToQUserLimit')
  async getAllDToQUserLimit(@Param('guildID') guildID: string, @Res() res: Response) {
    const results = await this.dToQUserLimitRepository.find({guild: guildID});
    res.status(200).json({ data: results });
  }

  @Post('DToQUserLimit')
  async postAllDToQUserLimit(@Body() body: DToQUserLimitEntity, @Res() res: Response) {
    const result = await this.dToQUserLimitRepository.save(body);
    res.status(200).json({ data: result });
  }


  @Delete('DToQUserLimit/:id')
  async deleteAllDToQUserLimit(@Param('id') id: string, @Res() res: Response) {
    const result = await this.dToQUserLimitRepository.delete(id)
    res.status(200).json({ data: result });
  }



}
