// 处理头部消息
import { Message as MiraiMessage, MessageType } from 'mirai-ts';
import { cacheDir, download, downloadImage, imageDiscordAvatarCacheDir } from '../utils/download-file';
import { createCanvas, loadImage } from 'canvas';
import * as path from 'path';
import * as fs from 'fs';
import { htmlTag, markdownEngine as markdown } from 'discord-markdown';
import { AtAll } from './interface';
import { MessageUtil } from './message';
import got from 'got';
import config from '../config';

export const bridgeRule = {
  atDC: {
    order: 0,
    match: source => /^@\[DC\] ([^\n#]+)#(\d\d\d\d)/.exec(source),
    parse: function(capture, parse, state) {
      console.log(capture);
      return { type: 'At', source: 'DC', username: capture[1], discriminator: capture[2] };
    },
    html: function(node, output, state) {
      return '{{atDc}}';
    },
  },
  atKHL: {
    order: 0,
    match: source => /^@\[KHL\] ([^\n#]+)#(\d\d\d\d)/.exec(source),
    parse: function(capture, parse, state) {
      console.log(capture);
      return { type: 'At', source: 'KHL', username: capture[1], discriminator: capture[2] };
    },
    html: function(node, output, state) {
      return '{{atDc}}';
    },
  },
  atQQ: {
    order: 0,
    match: source => /^@\[QQ\] ([^\n]+)(?:\()([0-9]+)\)(\#0000)?/.exec(source),
    parse: function(capture, parse, state) {
      console.log(capture);
      return { type: 'At', source: 'QQ', username: capture[1], qqNumber: capture[2] };
    },
    html: function(node, output, state) {
      return '{{atDc}}';
    },
  },
  Plain: Object.assign({}, markdown.defaultRules.text, {
    match: source => /^[\s\S]+?(?=[^0-9A-Za-z\s\u00c0-\uffff-]|\n\n|\n|\w+:\S|$)/.exec(source),
    parse: function(capture, parse, state) {
      return { type: 'Plain', text: capture[0] };
    },
    html: function(node, output, state) {
      if (state.escapeHTML)
        return markdown.sanitizeText(node.content);

      return node.content;
    },
  }),
  discordUser: {
    order: markdown.defaultRules.strong.order,
    match: source => /^<@!?([0-9]*)>/.exec(source),
    parse: function(capture) {
      return {
        id: capture[1]
      };
    },
    html: function(node, output, state) {
      return htmlTag('span', state.discordCallback.user(node), { class: 'd-mention d-user' }, state);
    }
  },
  discordEveryone: {
    order: markdown.defaultRules.strong.order,
    match: source => /^@everyone/.exec(source),
    parse: function(): AtAll {
      return MessageUtil.AtAll();
    },
    html: function(node, output, state) {
      return htmlTag('span', state.discordCallback.everyone(node), { class: 'd-mention d-user' }, state);
    },
  },
  discordHere: {
    order: markdown.defaultRules.strong.order,
    match: source => /^@here/.exec(source),
    parse: function(): AtAll {
      return MessageUtil.AtAll();
    },
    html: function(node, output, state) {
      return htmlTag('span', state.discordCallback.here(node), { class: 'd-mention d-user' }, state);
    }
  },
  discordEmoji: {
    order: markdown.defaultRules.strong.order,
    match: source => /^<(a?):(\w+):(\d+)>/.exec(source),
    parse: function(capture) {
      return {
        animated: capture[1] === "a",
        name: capture[2],
        id: capture[3],
      };
    },
    html: function(node, output, state) {
      return htmlTag('img', '', {
        class: `d-emoji${node.animated ? ' d-emoji-animated' : ''}`,
        src: `https://cdn.discordapp.com/emojis/${node.id}.${node.animated ? 'gif' : 'png'}`,
        alt: `:${node.name}:`
      }, false, state);
    }
  },
  khlEveryone: {
    order: markdown.defaultRules.strong.order,
    match: source => /\(met\)all\(met\)/.exec(source),
    parse: function(): AtAll {
      return { type: 'AtAll' };
    },
    html: function(node, output, state) {
      return htmlTag('span', state.discordCallback.everyone(node), { class: 'd-mention d-user' }, state);
    },
  },
};

export async function generateQQMsgContentAvatar(url: string, useCache?: boolean): Promise<MessageType.Image> {
  const filePath = await download(url, useCache);
  const img = await loadImage(filePath);
  const canvas = createCanvas(30, 30);
  const canvasCtx = canvas.getContext('2d');
  canvasCtx.arc(15, 15, 15, 0, Math.PI * 2, false);
  canvasCtx.clip();
  canvasCtx.drawImage(img, 0, 0, 30, 30);
  // const imgDataUrl = canvas.toDataURL();
  let stream = fs.createWriteStream(path.join(imageDiscordAvatarCacheDir, path.basename(filePath)));
  stream.write(canvas.toBuffer());
  stream.close();
  let relativePath = path.join('../', imageDiscordAvatarCacheDir.replace(cacheDir, 'cache'), path.basename(filePath));
  console.log('relativePath2: ', relativePath);
  return MiraiMessage.Image(null, null, relativePath.replace(/\\/g, '/'));
}

export async function remoteImageToLocal(avatar: string, useCache: boolean = true): Promise<string> {
  const result = await got.post(`${config.myDomainName}/api/remoteImageToLocal`, {
    json: {url: avatar, useCache: useCache},
    responseType: 'json',
  });
  const body: { data: string } = result.body as any;
  return body.data;
}
