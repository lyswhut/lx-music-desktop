import leaderboard from './leaderboard'
import songList from './songList'
import musicSearch from './musicSearch'
import { apis } from '../api-source'
import hotSearch from './hotSearch'
import comment from './comment'

const bili = {
  leaderboard,
  songList,
  musicSearch,
  hotSearch,
  comment,

  getMusicUrl(songInfo, type) {
    return apis('bili').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    // ignoring
    return Promise.resolve({ lyric: '', tlyric: '', rlyric: '', lxlyric: '' })
  },
  getPic(songInfo) {
    return apis('bili').getPic(songInfo)
  },
  getMusicDetailPageUrl(songInfo) {
    return `https://www.bilibili.com/video/${songInfo.songmid}`
  },
}

export default bili
