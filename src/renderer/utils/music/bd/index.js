import leaderboard from './leaderboard'
import { apis } from '../api-source'
import musicInfo from './musicInfo'
import songList from './songList'
import { httpFetch } from '../../request'
import musicSearch from './musicSearch'
import hotSearch from './hotSearch'

const bd = {
  leaderboard,
  songList,
  musicSearch,
  hotSearch,
  getMusicUrl(songInfo, type) {
    return apis('bd').getMusicUrl(songInfo, type)
  },
  getPic(songInfo) {
    const requestObj = this.getMusicInfo(songInfo)
    requestObj.promise = requestObj.promise.then(info => info.pic_premium)
    return requestObj
  },
  getLyric(songInfo) {
    const requestObj = this.getMusicInfo(songInfo)
    requestObj.promise = requestObj.promise.then(info => httpFetch(info.lrclink).promise.then(resp => resp.body))
    return requestObj
  },
  // getLyric(songInfo) {
  //   return apis('bd').getLyric(songInfo)
  // },
  // getPic(songInfo) {
  //   return apis('bd').getPic(songInfo)
  // },
  getMusicInfo(songInfo) {
    return musicInfo.getMusicInfo(songInfo.songmid)
  },
}

export default bd
