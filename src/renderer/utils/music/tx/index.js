import leaderboard from './leaderboard'
import lyric from './lyric'
import songList from './songList'
import musicSearch from './musicSearch'
import api_source from '../api-source'
import hotSearch from './hotSearch'

const tx = {
  leaderboard,
  songList,
  musicSearch,
  hotSearch,

  getMusicUrl(songInfo, type) {
    return api_source('tx').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    // let singer = songInfo.singer.indexOf('、') > -1 ? songInfo.singer.split('、')[0] : songInfo.singer
    return lyric.getLyric(songInfo.songmid)
  },
  getPic(songInfo) {
    return api_source('tx').getPic(songInfo)
  },
}

export default tx
