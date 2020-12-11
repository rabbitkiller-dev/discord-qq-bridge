import {AppConfig} from 'koishi';

export type serverType = 'qq' | 'discord';
export interface BridgeConfig {
    discord: {
        id: string,
        token: string,
        channelID: string,
    },
    qqGroup: number
}
export interface ImageSearchConfig {
    type: serverType;
    qqGroup: number;
    r18: boolean;
}

export interface Config extends AppConfig {
    imageSearch: ImageSearchConfig[];
    bridges: BridgeConfig[];
}
