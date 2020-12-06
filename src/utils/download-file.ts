import * as fs from "fs";
import * as path from "path";
import * as request from 'request';
import config from "../../koishi.config";

export const cacheDir = path.join(__dirname, '../../cache');
export const imageCacheDir = path.join(cacheDir, 'images');
export const imageDiscordAvatarCacheDir = path.join(cacheDir, 'images/discord-avatar');

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
}
// 下载文件并缓存
export async function downloadImage(params: { url: string, isCache?: boolean}): Promise<string> {
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
                    resolve(localPath)
                });
            })
            .on('error', function (err) {
                reject(err);
            })
    })

};