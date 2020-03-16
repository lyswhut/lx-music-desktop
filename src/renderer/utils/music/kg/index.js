import leaderboard from './leaderboard'
import api_source from '../api-source'
import songList from './songList'
import musicSearch from './musicSearch'
import pic from './pic'
import lyric from './lyric'
import hotSearch from './hotSearch'

const kg = {
  leaderboard,
  songList,
  musicSearch,
  hotSearch,
  getMusicUrl(songInfo, type) {
    return api_source('kg').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    return lyric.getLyric(songInfo)
  },
  // getLyric(songInfo) {
  //   return api_source('kg').getLyric(songInfo)
  // },
  getPic(songInfo) {
    return pic.getPic(songInfo)
  },
  // getPic(songInfo) {
  //   return api_source('kg').getPic(songInfo)
  // },
}

export default kg
