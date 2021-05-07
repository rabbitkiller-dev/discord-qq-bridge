import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';


export interface BridgeConfig {
  discord: {
    id: string,
    token: string,
    channelID: string,
  },
  qqGroup: number
}
export interface Config {
  qqBot: number,
  setting: {
    host: string,
    port: number,
    authKey: string,
    enableWebsocket: boolean,
  },
  discordBot: string;
  discordBotToken: string;
  bridges: BridgeConfig[];
  autoApproveQQGroup: Array<{qqGroup: number, reg: string}>
  proxy: string;
}


export interface Channel {
  id: string;
  name: string;
}

export interface Guild {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  discriminator: string;
  bot: boolean;
}


export interface DToQUserLimitEntity {
  id: number;
  guild: string;
  channel: string;
  user: string;
  createDate: Date;
}


@Injectable({providedIn: 'root'})
export class AdminService {
  guild: string;
  guilds: Guild[] = [];
  channels: Channel[] = [];
  users: User[] = [];

  constructor(public http: HttpClient) {
  }

  getConfig(): Observable<Config> {
    return this.http.get<{ data: Config }>('/api/bridge/config').pipe(map((result) => {
      return result.data
    }));
  }

  setConfig(config: Config): Observable<Config> {
    return this.http.post<{ data: Config }>('/api/bridge/config', config).pipe(map((result) => {
      return result.data
    }));
  }

  getGuilds(): Observable<Guild[]> {
    if (this.guilds.length) {
      return of(this.guilds)
    }
    return this.http.get<{ data: Array<Guild> }>('/api/bridge/guilds').pipe(map((result) => {
      this.guilds = result.data;
      return this.guilds
    }));
  }

  getGuildAllChannel(guild: string): Observable<Channel[]> {
    return this.http.get<{ data: Array<{ id: string, name: string }> }>(`/api/bridge/guilds/${guild}/channels`).pipe(map((result) => {
      this.channels = result.data;
      return this.channels
    }));
  }


  getGuildAllUsers(guild: string): Observable<User[]> {
    return this.http.get<{ data: Array<User> }>(`/api/bridge/guilds/${guild}/users`).pipe(map((result) => {
      this.users = result.data;
      return this.users
    }));
  }

  getAllDToQUserLimit(guild: string): Observable<DToQUserLimitEntity[]> {
    return this.http.get<{ data: DToQUserLimitEntity[] }>(`/api/bridge/guilds/${guild}/DToQUserLimit`).pipe(map((result) => {
      return result.data;
    }));
  }

  deleteAllDToQUserLimit(id: string): Observable<void> {
    return this.http.delete<{ data: DToQUserLimitEntity[] }>(`/api/bridge/DToQUserLimit/${id}`).pipe(map((result) => {
    }));
  }

  saveAllDToQUserLimit(entity: Partial<DToQUserLimitEntity>): Observable<DToQUserLimitEntity> {
    return this.http.post<{ data: DToQUserLimitEntity }>('/api/bridge/DToQUserLimit', entity).pipe(map((result) => {
      return result.data;
    }));
  }

  getGuild(id: string): Guild {
    return this.guilds.find(c => c.id === id);
  }


  getChannel(id: string): Channel {
    return this.channels.find(c => c.id === id);
  }

  getUser(id: string): User {
    return this.users.find(c => c.id === id);
  }
}
