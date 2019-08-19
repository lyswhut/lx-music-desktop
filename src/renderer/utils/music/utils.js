/**
 * 获取音乐音质
 * @param {*} info
 * @param {*} type
 */
const types = ['flac', 'ape', '320k', '192k', '128k']
export const getMusicType = (info, type) => {
  const rangeType = types.slice(types.indexOf(type))
  for (const type of rangeType) {
    if (info._types[type]) return type
  }
}
