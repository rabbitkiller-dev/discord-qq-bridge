// 处理头部消息
import { Message as MiraiMessage, MessageType } from 'mirai-ts';
import { cacheDir, download, downloadImage, imageDiscordAvatarCacheDir } from '../utils/download-file';
import { createCanvas, loadImage } from 'canvas';
import * as path from "path";
import * as fs from "fs";

export async function generateQQMsgContentAvatar(url: string, useCache?: boolean): Promise<MessageType.Image> {
  const filePath = await download(url, useCache);
  const img = await loadImage(filePath);
  const canvas = createCanvas(30, 30)
  const canvasCtx = canvas.getContext('2d');
  canvasCtx.arc(15, 15, 15, 0, Math.PI * 2, false)
  canvasCtx.clip()
  canvasCtx.drawImage(img, 0, 0, 30, 30);
  // const imgDataUrl = canvas.toDataURL();
  let stream = fs.createWriteStream(path.join(imageDiscordAvatarCacheDir, path.basename(filePath)));
  stream.write(canvas.toBuffer());
  stream.close();
  let relativePath = path.join('../../../../', imageDiscordAvatarCacheDir.replace(cacheDir, 'cache'), path.basename(filePath));
  return MiraiMessage.Image(null, null, relativePath.replace(/\\/g, '/'))
}
