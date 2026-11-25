import crypto from 'crypto'
import dns from 'dns'
import { decodeName } from '@renderer/utils'

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

/**
 * 严格解析非负安全整数（拒绝 null、空字符串、布尔值、负数、小数、NaN/Infinity 与对象）。
 * @param {*} value
 * @returns {number | null}
 */
export const parseNonNegativeInt = value => {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!/^\d+$/.test(trimmed)) return null
    const num = Number(trimmed)
    return Number.isSafeInteger(num) ? num : null
  }
  return null
}

/**
 * 严格解析目录项标识符（仅接受非空非零字符串或正安全整数，拒绝对象/数组/布尔值/0/空串）。
 * @param {*} value
 * @returns {string | null}
 */
export const parseValidCatalogId = value => {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed && trimmed !== '0' ? trimmed : null
  }
  return null
}

/**
 * 严格解析非空字符串（拒绝 null、数字、布尔值、对象及纯空白）。
 * @param {*} value
 * @returns {string | null}
 */
export const parseNonEmptyString = value => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}
