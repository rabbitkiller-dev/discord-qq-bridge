# discord-qq-bridge

### 一、下载安装go-cqhttp
[详细步骤](https://github.com/Mrs4s/go-cqhttp/blob/master/docs/quick_start.md)

1. 将对应操作系统的go-cqhttp下载到go-cqhttp目录
2. 将go-cqhttp/config.sample.json 复制拷贝成 config.json, 并配置
```shell script
"uin": 0, <--- qq号
"password": "", < --- 密码
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
| bridges.discord.channelID | string | 频道ID |
| bridges.qqGroup | number | q群号 |

### 三、运行
```shell script
npm install
npm start
```


### 文档相关
https://discordjs.guide/#before-you-begin
https://discord.com/developers/applications/781193252094476360/bot
https://link.zhihu.com/?target=https%3A//amazonaws-china.com/cn/
### 计划
1.
qq图片的mime类型获取,现在是写死了名字`attr.setName('unknown.png');`
https://blog.csdn.net/h13783313210/article/details/79250685

--- 

- [ ] 寻找献祭用的qq(火急火)
- [ ] 回复消息
    - [x] 支持`qq`回复消息同步至discord (11.29)
    - [ ] 支持`qq`回复discord消息
- [x] at
    - [x] 支持`qq`@qq用户同步消息至discord (11.29)
    - [x] 支持`qq`@discord用户 (11.30)
    - [x] 支持`discord`@qq用户同步消息至discord (11.30)
    - [x] 支持`discord`@qq用户 (11.30)
- [ ] 支持qq.gif发送到discord
- [ ] 支持qq.特殊符号发送到discord
- [ ] 使用canvas装饰qq接收discord显示的用户名
- [ ] 撤回消息
- [x] 支持discord表情发送到qq (11.29)
- [x] 支持discord.emoji发送到qq (11.29)
- [x] 支持qq图片发送到discord (11.28)
- [x] webhook代替discord接收qq消息的[QQ] (11.28)
