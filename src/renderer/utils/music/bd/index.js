import leaderboard from './leaderboard'
import api_source from '../api-source'
import musicInfo from './musicInfo'

const bd = {
  leaderboard,
  getMusicUrl(songInfo, type) {
    return api_source('bd').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    return api_source('bd').getLyric(songInfo)
  },
  getPic(songInfo) {
    return api_source('bd').getPic(songInfo)
  },
  getMusicInfo(songInfo) {
    return musicInfo.getMusicInfo(songInfo.songmid)
  },
}

export default bd
