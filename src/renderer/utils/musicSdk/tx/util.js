/**
 * 处理歌手列表
 * @param {Array} rawList
 */
export const formatSingerList = (rawList) => {
  let returnList = []
  rawList.forEach((s) => {
    returnList.push({
      name: s.name,
      id: String(s.id),
      mid: s.mid,
    })
  })
  return returnList
}
