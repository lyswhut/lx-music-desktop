const fs = require('fs')
const path = require('path')

exports.jp = (...p) => p.length ? path.join(__dirname, ...p) : __dirname

exports.copyFile = (source, target) => new Promise((resolve, reject) => {
  const rd = fs.createReadStream(source)
  rd.on('error', err => reject(err))
  const wr = fs.createWriteStream(target)
  wr.on('error', err => reject(err))
  wr.on('close', () => resolve())
  rd.pipe(wr)
})

/**
 * 时间格式化
 * @param {Date} d 格式化的时间
 * @param {boolean} b 是否精确到秒
 */
exports.formatTime = (d, b) => {
  const _date = d == null ? new Date() : typeof d == 'string' ? new Date(d) : d
  const year = _date.getFullYear()
  const month = fm(_date.getMonth() + 1)
  const day = fm(_date.getDate())
  if (!b) return year + '-' + month + '-' + day
  return year + '-' + month + '-' + day + ' ' + fm(_date.getHours()) + ':' + fm(_date.getMinutes()) + ':' + fm(_date.getSeconds())
}

function fm(value) {
  if (value < 10) return '0' + value
  return value
}

exports.sizeFormate = size => {
  // https://gist.github.com/thomseddon/3511330
  if (!size) return '0 b'
  let units = ['b', 'kB', 'MB', 'GB', 'TB']
  let number = Math.floor(Math.log(size) / Math.log(1024))
  return `${(size / Math.pow(1024, Math.floor(number))).toFixed(2)} ${units[number]}`
}

exports.parseArgv = argv => {
  const params = {}
  argv.forEach(item => {
    const argv = item.split('=')
    switch (argv[0]) {
      case 'ver':
        params.ver = argv[1]
        break
      case 'draft':
        params.isDraft = argv[1] === 'true' || argv[1] === undefined
        break
      case 'prerelease':
        params.isPrerelease = argv[1] === 'true' || argv[1] === undefined
        break
      case 'target_commitish':
        params.target_commitish = argv[1]
        break
    }
  })
  return params
}
