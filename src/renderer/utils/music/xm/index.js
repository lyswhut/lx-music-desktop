import { apis } from '../api-source'
import leaderboard from './leaderboard'
import songList from './songList'
import musicSearch from './musicSearch'
// import pic from './pic'
import lyric from './lyric'
import hotSearch from './hotSearch'
import { closeVerifyModal } from './util'

const xm = {
  songList,
  musicSearch,
  leaderboard,
  hotSearch,
  closeVerifyModal,
  getMusicUrl(songInfo, type) {
    return apis('xm').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    return lyric.getLyric(songInfo)
  },
  getPic(songInfo) {
    return Promise.reject(new Error('fail'))
    // return pic.getPic(songInfo)
  },
  getMusicDetailPageUrl(songInfo) {
    return songInfo.songStringId ? `https://www.xiami.com/song/${songInfo.songStringId}` : null
  },
  // init() {
  //   getToken()
  // },
}

export default xm
