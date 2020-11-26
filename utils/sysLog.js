const fs = require('fs')
const path = require('path');
/**
 * Date format
 */
Date.prototype.format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1,                 //月份
    'd+': this.getDate(),                      //日
    'h+': this.getHours(),                     //小时
    'm+': this.getMinutes(),                   //分
    's+': this.getSeconds(),                   //秒
    'q+': Math.floor((this.getMonth() + 3) / 3), //季度
    'S': this.getMilliseconds()               //毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  for (var k in o)
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
  return fmt
}

function sysLog(...params) {
  console.log(...params)
  var text = []
  var now = new Date()
  // var file = '/opt/koishi/log/' + now.format('yyyy-MM-dd') + '.log';
  var file = path.join(__dirname, '../logs', now.format('yyyy-MM-dd') + '.log')
  text.push('[' + now.format('yyyy-MM-dd hh:mm:ss') + ']')
  for (let i of params) {
    if (typeof i === 'string') {
      text.push(i)
    } else if (typeof i === 'object') {
      try {
        text.push(JSON.stringify(i))
      } catch (e) { }
    } else {
      text.push(String(i))
    }
  }
  text = text.join(' ').replace(/\n/g, ' ') + '\n'
  fs.writeFile(file, text, { flag: 'a' }, function (err) {
    if (err) console.error(err)
  })
}

module.exports = {
  sysLog
}
