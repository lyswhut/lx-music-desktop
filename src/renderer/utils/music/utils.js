import crypto from 'crypto'
import dns from 'dns'
import { qualityList } from '@renderer/core/share'


/**
 * 获取音乐音质
 * @param {*} info
 * @param {*} type
 */

const types = ['flac', 'wav', 'ape', '320k', '192k', '128k']
export const getMusicType = (info, type) => {
  let list = qualityList.value[info.source]
  if (!list) return '128k'
  if (!list.includes(type)) type = list[list.length - 1]
  const rangeType = types.slice(types.indexOf(type))
  for (const type of rangeType) {
    if (info._types[type]) return type
  }
  return '128k'
}

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
