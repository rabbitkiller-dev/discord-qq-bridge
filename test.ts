import {App} from 'koishi';
import 'koishi-adapter-cqhttp';
import * as pluginCommon from 'koishi-plugin-common';
import * as request from 'request';
import * as fs from 'fs';
import * as mime from 'mime';
import * as path from 'path';
import {Client} from 'discord.js';
import {CQCode} from 'koishi-utils';
const {sysLog} = require('./utils/sysLog'); // sysLog 保存日志

import config from './koishi.config';
import {parse} from 'ts-node';

const discord = new Client();
const koishi = new App(config);

/**
 * @dependencies 添加 koishi 插件
 */
koishi.plugin(pluginCommon, {welcome: ''});
// koishi.plugin(require('koishi-plugin-chess'))
// koishi.plugin(require('koishi-plugin-mcping'));
// koishi.plugin(require('koishi-plugin-mysql'))
// koishi.plugin(require('koishi-plugin-image-search'));
// koishi.plugin(require('koishi-plugin-status'))

/**
 * @method koishi.start koishi启动完毕，登录discord
 */
koishi.start().then(async () => {
  /** @end */
  sysLog('🌈', 'koishi进程重新加载')
  init();
});

async function init() {
  // koishi.group(518986671).on('message', msg => {
  //   console.log(CQCode.parseAll(msg.message));
  //   // new MessageAttachment('https://i.imgur.com/w3duR07.png');
  // });
  // const src = await downloadFront('https://media.discordapp.net/attachments/781347109676384297/781529708205703248/unknown.png')
  // const src = await downloadFront('https://cdn.discordapp.com/attachments/781347109676384297/781527834664763392/unknown.png')
  koishi.bots[0].sendGroupMsg(518986671,
    CQCode.stringify('image', { file: 'https://pics2.baidu.com/feed/b7fd5266d0160924f8a90974931d93fde7cd34f6.jpeg?token=10fe32e489e35157749a48ec5d0f78a6' }),
    // `[CQ:image,file=https://cdn.discordapp.com/attachments/781347109676384297/781527834664763392/unknown.png]`,
    )
    .then(()=>{
      console.log('发送');
    })

}
async function downloadFront(url) {
  return new Promise<string>(function (resolve, reject) {
    request(url, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const src = path.join(__dirname, path.basename('unknown.png'));
        let stream = fs.createWriteStream(src);
        request(url).pipe(stream).on("close", (err) => {
          resolve(src);
        });
      } else {
        if (error) {
          reject(error);
        } else {
          reject(new Error("下载失败，返回状态码不是200，状态码：" + response.statusCode));
        }
      }
    });
  });
};
