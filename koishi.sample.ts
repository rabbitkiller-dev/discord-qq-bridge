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
<<<<<<< HEAD
        {
            discord: {
                id: '', // 频道webhook id
                token: '', // 频道webhook token
                channelID: '', // 频道id
            },
            qqGroup: 0 // q群
        }
=======
        { discordChannel: '', qqGroup: 0}
>>>>>>> parent of 9c3984e... 重构一版: 并使用支持webhook代替discord接收qq消息的
    ]
}
