# discord-qq-bridge

## 前置说明
### 关于QQ机器人
QQ机器人使用了el-bot的js库
- [mirai-console-loader](https://github.com/iTXTech/mirai-console-loader) 帮助你搭建mirai所需要的环境
- [el-bot](https://docs.bot.elpsy.cn)：是一个接入mirai平台的一个机器人nodejs库，用来方便我们使用nodejs制作qq机器人

### 关于Discord机器人
Discord制作机器人不需要类似go-cqhttp的中转程序。官方已经提供了相关api和开发者平台，让开发人员方便的制作机器人

使用[discord.js](https://www.npmjs.com/package/discord.js) 库就可以方便的使用

## 本库安装使用方式
### 一、启动MCL (mirai一键安装环境工具)
> 使用Docker的方式
1. 修改文件 `mcl-1.1.0-beta.1/config/Console/AutoLogin.yml` 添加属于你的qq账号
2. 直接运行命令 `docker-compose up`
正常情况，bot收到消息后，控制台会看的到就成功了

> 非Docker的方式

1. 安装java jdk 并且11以上的版本，配置好java环境变量， 控制台输入`java --version` 能看到版本信息就正常
2. 修改文件 `mcl-1.1.0-beta.1/config/Console/AutoLogin.yml` 添加属于你的qq账号
3. 进入`mcl-1.1.0-beta.1`目录，运行`./mcl`
正常情况，bot收到消息后，控制台会看的到就成功了
   
> 注： 推荐使用docker的方式，不只是本地，部署到云环境也方便

### 二、配置
将config.sample.json 复制拷贝成 config.json, 并配置下面几项
```shell script
qqBot: 0, // 用来当bot的qq号码
discordBot: '', // discord申请的bot id
discordBotToken: '', // discord申请的bot id对应的token
    bridges: [
        {
            bridge: {
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
npm run start:dev
```

### 三、生产发布
推荐使用pm2管理
```shell script
npm install
npm run build

## 启动
pm2 start dist/main.js --name bridge
## 停止
pm2 stop bridge
## 重启
pm2 restart bridge
## 查看
pm2 ls
```

## 支持功能
### QQ -> Discord
- [x] 回复消息同步至Discord
- [x] 支持表情、图片和gif消息同步至Discord
- [x] 支持回复消息同步至Discord

### Discord -> QQ
- [x] 回复消息同步至Discord
- [x] 支持图片和gif消息同步至Discord
- [x] 支持回复消息同步至Discord

## 文档相关
官方api文档
- https://discordjs.guide/#before-you-begin
- https://discord.com/developers/applications/781193252094476360/bot
- https://link.zhihu.com/?target=https%3A//amazonaws-china.com/cn/


# ElBot
/autoLogin add <qqNumber> <password> 
