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
