import songList from './songList'
import musicSearch from './musicSearch'
import { apis } from '../api-source'
import hotSearch from './hotSearch'
import comment from './comment'

const bili = {
  songList,
  musicSearch,
  hotSearch,
  comment,

  getMusicUrl(songInfo, type) {
    return apis('bili').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    throw new Error('Bilibili暂无歌词接口')
  },
  getPic(songInfo) {
    return apis('bili').getPic(songInfo)
  },
  getMusicDetailPageUrl(songInfo) {
    return `https://www.bilibili.com/video/${songInfo.songmid}`
  },
}

export default bili
