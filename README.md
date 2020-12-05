# discord-qq-bridge

## 前置说明
> 关于QQ机器人

想要使用QQ机器人，首先需要安装go-cqhttp。<br>
[go-cqhttp](https://github.com/Mrs4s/go-cqhttp)：是一个用来连接QQ并且会将消息通过http或websocket的方式上报给koishi程序。以达到让程序接收消息和发送消息<br>
[Koishi](https://www.npmjs.com/package/koishi)：是一个接入类似go-cqhttp平台的一个机器人nodejs库，用来方便我们使用nodejs制作qq机器人

> 关于Discord机器人

Discord制作机器人不需要类似go-cqhttp的中转程序。官方已经提供了相关api和开发者平台，让开发人员方便的制作机器人<br>
使用[discord.js](https://www.npmjs.com/package/discord.js)库就可以方便的使用


## 本库安装使用方式
### 一、下载安装go-cqhttp
[详细步骤](https://github.com/Mrs4s/go-cqhttp/blob/master/docs/quick_start.md)

1. 将对应操作系统的go-cqhttp下载到go-cqhttp目录
2. 将go-cqhttp/config.sample.json 复制拷贝成 config.json 并配置
```shell script
"uin": 0, <--- qq号
"password": "", <--- 密码
```
3. 启动go-cqhttp

### 二、配置
将koishi.sample.ts 复制拷贝成 koishi.config.ts, 并配置下面几项
```shell script
qqBot: 0,
discordBot: '',
discordBotToken: '',
    bridges: [
        {
            discord: {
                id: '', // 频道webhook id
                token: '', // 频道webhook token
                channelID: '', // 频道id
            },
            qqGroup: 0 // q群
        }
    ]
```
| key | 类型 | 说明 |
| --- | --- | --- |
| qqBot | number | qqBot的qq号 |
| discordBot | string | discordBot的ID |
| discordBotToken | string | discordBot的token |
| bridges | list | 联通桥 |
| bridges.discord.id | string | 频道webhook id |
| bridges.discord.token | string | 频道webhook token |
| bridges.discord.channelID | string | 频道id |
| bridges.qqGroup | number | q群号 |

### 三、运行
```shell script
npm install
npm start
```

### 支持功能

> QQ -> Discord
- [x] 回复消息同步至Discord
- [x] 支持表情、图片和gif消息同步至Discord
- [x] 支持回复消息同步至Discord
> Discord -> QQ
- [x] 回复消息同步至Discord
- [ ] 支持图片和gif消息同步至Discord (gif暂不支持)
- [x] 支持回复消息同步至Discord

### 文档相关
官方api文档
https://discordjs.guide/#before-you-begin
https://discord.com/developers/applications/781193252094476360/bot
https://link.zhihu.com/?target=https%3A//amazonaws-china.com/cn/


