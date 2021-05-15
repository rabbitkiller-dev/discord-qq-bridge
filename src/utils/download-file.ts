import * as fs from "fs";
import * as path from "path";
import * as request from 'request';
import config from "../config";
import got from "got";
import * as FileType from "file-type";
import * as md5 from "md5";

export const cacheDir = path.join(__dirname, '../../cache');
export const imageCacheDir = path.join(cacheDir, 'images');
export const imageDiscordAvatarCacheDir = path.join(cacheDir, 'images/bridge-avatar');
export const imageDiscordAttachmentCacheDir = path.join(cacheDir, 'images/bridge-attachment');
export const imageQQEmojiCacheDir = path.join(cacheDir, 'images/qq-emoji');

async function initCache() {
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir);
    }
    if (!fs.existsSync(imageCacheDir)) {
        fs.mkdirSync(imageCacheDir);
    }
    if (!fs.existsSync(imageDiscordAvatarCacheDir)) {
        fs.mkdirSync(imageDiscordAvatarCacheDir);
    }
    if (!fs.existsSync(imageQQEmojiCacheDir)) {
        fs.mkdirSync(imageQQEmojiCacheDir);
    }
    if (!fs.existsSync(imageDiscordAttachmentCacheDir)) {
        fs.mkdirSync(imageDiscordAttachmentCacheDir);
    }
}

// 下载文件并缓存
export async function downloadImage(params: { url: string, isCache?: boolean }): Promise<string> {
    params = Object.assign({isCache: true}, params);
    await initCache();
    const filename = path.basename(params.url);
    const localPath = path.join(imageCacheDir, filename)
    if (fs.existsSync(localPath)) {
        return Promise.resolve(localPath);
    }
    return new Promise((resolve, reject) => {
        request.defaults({proxy: config.proxy, timeout: 60000})
            .get(params.url)
            .on('response', function (response) {
                if (response.statusCode !== 200) {
                    reject(`下载失败,请检查网络或代理${response.statusCode}:${params.url}`);
                }
                let stream = fs.createWriteStream(localPath);
                response.on('data', (chunk) => {
                    stream.write(chunk);
                }).on('end', () => {
                    stream.close();
                });
                stream.on('close', () => {
                    resolve(localPath)
                });
            })
            .on('error', function (err) {
                reject(err);
            })
    })

};

// 下载qq图片并缓存
export async function downloadQQImage(params: { url: string, cache?: boolean }): Promise<string> {
    params = Object.assign({cache: true}, params);
    await initCache();
    const fileMD5Name = md5(params.url);
    const isExists = fs.readdirSync(imageQQEmojiCacheDir).find((file) => file.startsWith(fileMD5Name));
    if (isExists && params.cache) {
        return path.join(imageQQEmojiCacheDir, isExists);
    }
    const stream = got.stream(params.url);
    const fileType = await FileType.fromStream(stream);
    const filename = `${md5(params.url)}.${fileType.ext}`;
    const localPath = path.join(imageQQEmojiCacheDir, filename);
    let writeStream = fs.createWriteStream(localPath);
    return new Promise((resolve, reject) => {
        got.stream(params.url).pipe(writeStream).on("close", () => {
            resolve(localPath)
        })
    })
};
// 下载discord附件并缓存
export async function downloadDiscordAttachment(params: { url: string, cache?: boolean }): Promise<string> {
    params = Object.assign({cache: true}, params);
    await initCache();
    const fileMD5Name = md5(params.url);
    const isExists = fs.readdirSync(imageDiscordAttachmentCacheDir).find((file) => file.startsWith(fileMD5Name));
    if (isExists && params.cache) {
        return path.join(imageDiscordAttachmentCacheDir, isExists);
    }
    const filename = `${md5(params.url)}${path.extname(params.url)}`;
    const localPath = path.join(imageDiscordAttachmentCacheDir, filename);
    let writeStream = fs.createWriteStream(localPath);

    return new Promise((resolve, reject) => {
        request.defaults({proxy: config.proxy, timeout: 60000})
          .get(params.url)
          .on('response', function (response) {
              if (response.statusCode !== 200) {
                  reject(`下载失败,请检查网络或代理${response.statusCode}:${params.url}`);
              }
              response.on('data', (chunk) => {
                  writeStream.write(chunk);
              }).on('end', () => {
                  writeStream.close();
                  resolve(localPath)
              });
          })
          .on('error', function (err) {
              reject(err);
          })
    })
};
