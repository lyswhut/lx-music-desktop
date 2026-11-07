import leaderboard from './leaderboard'
import { apis } from '../api-source'
import getLyric from './lyric'
import getMusicInfo from './musicInfo'
import musicSearch from './musicSearch'
import songList from './songList'
import hotSearch from './hotSearch'
import comment from './comment'
// import tipSearch from './tipSearch'

const wy = {
  // tipSearch,
  leaderboard,
  musicSearch,
  songList,
  hotSearch,
  comment,
  getMusicUrl(songInfo: any, type: any) {
    return apis('wy').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo: any) {
    return getLyric(songInfo.songmid)
  },
  getPic(songInfo: any) {
    const requestObj = getMusicInfo(songInfo.songmid)
    return requestObj.promise.then((info: any) => info.al.picUrl)
  },
  getMusicDetailPageUrl(songInfo: any) {
    return `https://music.163.com/#/song?id=${songInfo.songmid}`
  },
}

export default wy
