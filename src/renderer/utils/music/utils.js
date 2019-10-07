/**
 * 获取音乐音质
 * @param {*} info
 * @param {*} type
 */

const types = ['flac', 'ape', '320k', '192k', '128k']
export const getMusicType = (info, type) => {
  switch (info.source) {
    // case 'kg':
    case 'wy':
    case 'tx':
      return '128k'
  }
  const rangeType = types.slice(types.indexOf(type))
  for (const type of rangeType) {
    if (info._types[type]) return type
  }
  return '128k'
}
