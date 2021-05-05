import * as fs from 'fs';
import * as path from 'path';

interface BridgeConfig {
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
const config = {} as Config;
const json = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json')).toString());
Object.assign(config, json);

export default config;
