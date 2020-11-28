export default {
    type: 'cqhttp:http',
    port: 3100,
    server: "http://localhost:5700",
    selfId: 0,
    nickname: "rabbitBot",
    commandPrefix: ['!', '！'],
    // 当数据库中不存在用户，以 1 级权限填充
    defaultAuthority: 1,
    qqBot: 0,
    discordBot: '',
    discordBotToken: '',
    bridges: [
        {
            discord: {
                id: '', // 频道机器人id
                token: '', // 频道机器人token
                channelID: '', // 频道id
            },
            qqGroup: 0 // q群
        }
    ]
}
