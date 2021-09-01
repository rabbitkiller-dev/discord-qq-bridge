export interface BridgeConfig {
    discord: {
        id: string,
        token: string,
        channelID: string,
    },
    qqGroup: number;
    kaiheila: {
        channelID: string,
    },
    enable: boolean;
}
