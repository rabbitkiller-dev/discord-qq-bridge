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
    { discordChannel: '', qqGroup: 0}
] 
```
| key | 类型 | 说明 |
| --- | --- | --- |
| qqBot | number | qqBot的qq号 |
| discordBot | string | discordBot的ID |
| discordBotToken | string | discordBot的token |
| bridges | list | 联通桥 |
| bridges.discordChannel | string | 频道ID |
| bridges.qqGroup | number | q群号 |

### 三、运行
```shell script
npm install
npm start
```


### 文档相关
https://discordjs.guide/#before-you-begin

### 计划
1.
qq图片的mime类型获取,现在是写死了名字`attr.setName('temp.png');`
https://blog.csdn.net/h13783313210/article/details/79250685

--- 

- [x] 支持qq图片发送到discord
- [ ] 支持discord表情发送到qq
- [ ] 支持discord.emoji发送到qq
- [ ] 支持qq.gif发送到discord
- [ ] 撤回消息
- [ ] webhook代替discord接收qq消息的[QQ]
