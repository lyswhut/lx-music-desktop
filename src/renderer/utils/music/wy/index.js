import leaderboard from './leaderboard'
import api_source from '../api-source'

const wy = {
  leaderboard,
  getMusicUrl(songInfo, type) {
    return api_source('wy').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    return api_source('wy').getLyric(songInfo)
  },
  getPic(songInfo) {
    return api_source('wy').getPic(songInfo)
  },
}

export default wy
