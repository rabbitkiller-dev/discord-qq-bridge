import * as path from "path";
import * as fs from "fs"; // import locale
import * as dayjs from "dayjs";
import * as isLeapYear from 'dayjs/plugin/isLeapYear' // import plugin
import 'dayjs/locale/zh-cn'

dayjs.extend(isLeapYear) // use plugin
dayjs.locale('zh-cn') // use locale

export function error(...messages) {
    log5('error', ...messages)
}
export function message(...messages) {
    log5('message', ...messages)
}

export function log5(type, ...messages) {
    console.log(...messages)
    let texts = []
    const now = dayjs()
    const file = path.join(__dirname, '../logs', `${type}.${now.format('yyyy-MM-dd')}.log`)
    texts.push('[' + now.format('yyyy-MM-dd hh:mm:ss') + ']')
    for (let i of messages) {
        if (typeof i === 'string') {
            texts.push(i)
        } else if (typeof i === 'object') {
            try {
                texts.push(JSON.stringify(i))
            } catch (e) { }
        } else {
            texts.push(String(i))
        }
    }
    const text = texts.join(' ').replace(/\n/g, ' ') + '\n'
    fs.writeFile(file, text, { flag: 'a' }, function (err) {
        if (err) console.error(err)
    })
}