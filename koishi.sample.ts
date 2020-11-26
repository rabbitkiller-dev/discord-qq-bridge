// require('koishi-database-mysql')

export default {
    type: 'http',
    port: 3100,
    server: "http://localhost:5700",
    selfId: 1111111111,
    nickname: "sili",
    commandPrefix: ['!', '！'],
    // database: {
    //     mysql: {
    //         host: '127.0.0.1',
    //         port: 3306,
    //         user: 'root',
    //         password: password.dbPassword.mysql.root,
    //         database: 'wjghj-qqbot-koishi'
    //     }
    // },
    // 当数据库中不存在用户，以 1 级权限填充
    defaultAuthority: 1
}
