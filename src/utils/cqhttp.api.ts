import axios from "axios";
import config from "../koishi.config";
import * as log5 from "./log5";

export class CqHttpApi {

    /**
     * 获取消息
     */
    static async getMsg(messageID: string) {
        const response = await axios.get(config.server + '/get_msg', {
            params: {
                message_id: messageID
            }
        })
    }

    /**
     * 获取图片信息
     */
    static async getImage(cqImage: string): Promise<{ file: string, filename: string, size: number, url: string }> {
        const response = await axios.get(config.server + '/get_image', {
            params: {
                file: cqImage
            }
        });
        if (response.data.retcode === 0) {
            return response.data.data;
        } else {
            log5.error('获取图片信息错误', response)
            throw new Error('获取图片信息错误');
        }
    }
}