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
    config.bridges = body.bridges;
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

  @Get('discordAllGuildAndChannelsInfo')
  async getDiscordAllGuildAndChannelsInfo(@Res() res: Response) {
    const result: DiscordAllInfo = {
      guild: [],
      webhooks: [],
      hasManageWebhooks: false
    }
    const guildList = BotService.discord.guilds.cache.array();
    for (const guild of guildList) {
      result.hasManageWebhooks = guild.me.hasPermission('MANAGE_WEBHOOKS')
      if (result.hasManageWebhooks) {
        const webhooks = await guildList[0].fetchWebhooks();
        webhooks.forEach((webhook) => {
          result.webhooks.push({id: webhook.id, name: webhook.name, token: webhook.token});
        })
      }
      const channels = [];
      BotService.discord.guilds.cache.get(guild.id).channels.cache.forEach((value, key, map) => {
        if (value.type === 'text') {
          channels.push({id: key, name: value.name})
        }
      })
      result.guild.push({
        id: guild.id, name: guild.name, channels
      })
    }
    res.status(200).json({data: result});
  }

  @Get('khlAllInfo')
  async getKhlAllInfo(@Res() res: Response) {
    const result: KHLAllInfo = {
      guild: [],
    }
    const guildList = await BotService.kaiheila.API.guild.list();
    for (let guild of guildList.items) {
      const channelList = await await BotService.kaiheila.API.channel.list(guild.id);
      const channels = [];
      channelList.items.forEach(channel => {
        if (channel.type !== 1 || channel.isCategory) {
          return;
        }
        channels.push({id: channel.id, name: channel.name});
      })
      result.guild.push({
        id: guild.id,
        name: guild.name,
        channels
      })
    }
    res.status(200).json({data: result});
  }

  @Get('qqAllInfo')
  async getQQAllInfo(@Res() res: Response) {
    const result: QQAllInfo = {
      group: [],
    }
    const groupList = await BotService.qqBot.mirai.api.groupList();
    groupList.forEach((group) => {
      result.group.push({
        id: group.id,
        name: group.name,
      })
    })

    res.status(200).json({data: result});
  }

}

interface QQAllInfo {
  group: Array<{ id: number, name: string }>
}

interface KHLAllInfo {
  guild: Array<{
    id: string,
    name: string
    channels: Array<{ id: string, name: string }>
  }>;
}

interface DiscordAllInfo {
  guild: Array<{
    id: string,
    name: string
    channels: Array<{ id: string, name: string }>
  }>;
  hasManageWebhooks: boolean;
  webhooks: Array<{ id: string, name: string, token: string }>
}
