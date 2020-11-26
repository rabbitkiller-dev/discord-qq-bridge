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
    bridges: [
        { discordChannel: '', qqGroup: 0}
    ]
}
