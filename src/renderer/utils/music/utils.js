import crypto from 'crypto'

/**
 * 获取音乐音质
 * @param {*} info
 * @param {*} type
 */

const types = ['flac', 'wav', 'ape', '320k', '192k', '128k']
export const getMusicType = (info, type) => {
  let list = window.globalObj.qualityList[info.source]
  if (!list) return '128k'
  if (!list.includes(type)) type = list[list.length - 1]
  const rangeType = types.slice(types.indexOf(type))
  for (const type of rangeType) {
    if (info._types[type]) return type
  }
  return '128k'
}

export const toMD5 = str => crypto.createHash('md5').update(str).digest('hex')
