import leaderboard from './leaderboard'
import api_source from '../api-source'
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
    return api_source('bd').getMusicUrl(songInfo, type)
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
  //   return api_source('bd').getLyric(songInfo)
  // },
  // getPic(songInfo) {
  //   return api_source('bd').getPic(songInfo)
  // },
  getMusicInfo(songInfo) {
    return musicInfo.getMusicInfo(songInfo.songmid)
  },
}

export default bd
