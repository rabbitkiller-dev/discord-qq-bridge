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
// {
//   qqBot: 3245538509,
//   setting: {
//     host: "localhost",
//     port: 8080,
//     authKey: 'INITKEYKPRGCLwL',
//     enableWebsocket: false,
//   },
//   discordBot: '781193252094476360',
//   discordBotToken: 'NzgxMTkzMjUyMDk0NDc2MzYw.X76E6Q.lCYGqH-6D44p7RODsBRMvzcLlP8',
//   bridges: [
//     {
//       discord: {
//         id: '782282707253854328',
//         token: '89A7nQnBOUrqz9o3b4orizWJNn_CP-F4T3z9ragsAx5k_7oiSPZz2QW0fB2EA9Z9BGsE',
//         channelID: '781347109676384297',
//       },
//       qqGroup: 518986671
//     }
//   ],
//   proxy: '',
// } as Config;
