import crypto from 'crypto'
import dns from 'dns'
import { decodeName } from '@common/utils/common'

export const toMD5 = str => crypto.createHash('md5').update(str).digest('hex')


const ipMap = new Map()
export const getHostIp = hostname => {
  const result = ipMap.get(hostname)
  if (typeof result === 'object') return result
  if (result === true) return
  ipMap.set(hostname, true)
  // console.log(hostname)
  dns.lookup(hostname, {
    // family: 4,
    all: false,
  }, (err, address, family) => {
    if (err) return console.log(err)
    // console.log(address, family)
    ipMap.set(hostname, { address, family })
  })
}

export const dnsLookup = (hostname, options, callback) => {
  const result = getHostIp(hostname)
  if (result) return callback(null, result.address, result.family)

  dns.lookup(hostname, options, callback)
}


/**
 * 格式化歌手
 * @param singers 歌手数组
 * @param nameKey 歌手名键值
 * @param join 歌手分割字符
 */
export const formatSingerName = (singers, nameKey = 'name', join = '、') => {
  if (Array.isArray(singers)) {
    const singer = []
    singers.forEach(item => {
      let name = item[nameKey]
      if (!name) return
      singer.push(name)
    })
    return decodeName(singer.join(join))
  }
  return decodeName(String(singers ?? ''))
}
