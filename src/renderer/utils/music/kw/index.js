import { httpGet, cancelHttp } from '../../request'
import tempSearch from './tempSearch'
import musicSearch from './musicSearch'
import { formatSinger } from './util'
import leaderboard from './leaderboard'
import lyric from './lyric'

const kw = {
  _musicInfoIndex: null,
  _musicInfoPromiseCancelFn: null,
  _musicPicIndex: null,
  _musicPicPromiseCancelFn: null,
  // context: null,


  // init(context) {
  //   if (this.isInited) return
  //   this.isInited = true
  //   this.context = context

  //   // this.musicSearch.search('我又想你了').then(res => {
  //   //   console.log(res)
  //   // })

  //   // this.getMusicUrl('62355680', '320k').then(url => {
  //   //   console.log(url)
  //   // })
  // },

  tempSearch,
  musicSearch,
  leaderboard,
  getLyric(songInfo) {
    // let singer = songInfo.singer.indexOf('、') > -1 ? songInfo.singer.split('、')[0] : songInfo.singer
    return lyric.getLyric(songInfo.songmid)
  },
  handleMusicInfo(songInfo) {
    return this.getMusicInfo(songInfo).then(info => {
      // console.log(JSON.stringify(info))
      songInfo.name = info.name
      songInfo.singer = formatSinger(info.artist)
      songInfo.img = info.pic
      songInfo.albumName = info.album
      return songInfo
      // return Object.assign({}, songInfo, {
      //   name: info.name,
      //   singer: formatSinger(info.artist),
      //   img: info.pic,
      //   albumName: info.album,
      // })
    })
  },

  getMusicUrl(songInfo, type) {
    return new Promise((resolve, reject) => {
      httpGet(`https://v1.itooi.cn/kuwo/url?id=${songInfo.songmid}&quality=${type.replace(/k$/, '')}&isRedirect=0`, (err, resp, body) => {
        if (err) {
          console.log(err)
          return this.getMusicUrl(songInfo, type)
        }
        body.code === 200 ? resolve({ type, url: body.data }) : reject(new Error(body.msg))
      })
    })
  },

  getMusicInfo(songInfo) {
    if (this._musicInfoIndex != null) {
      cancelHttp(this._musicInfoIndex)
      this._musicInfoPromiseCancelFn(new Error('取消http请求'))
    }
    return new Promise((resolve, reject) => {
      this._musicInfoPromiseCancelFn = reject
      this._musicInfoIndex = httpGet(`http://www.kuwo.cn/api/www/music/musicInfo?mid=${songInfo.songmid}`, (err, resp, body) => {
        this._musicInfoIndex = null
        this._musicInfoPromiseCancelFn = null
        if (err) {
          console.log(err)
          reject(err)
        }
        body.code === 200 ? resolve(body.data) : reject(new Error(body.msg))
      })
    })
  },

  getMusicUrls(musicInfo, cb) {
    let tasks = []
    let songId = musicInfo.songmid
    musicInfo.types.forEach(type => {
      tasks.push(kw.getMusicUrl(songId, type.type))
    })
    Promise.all(tasks).then(urlInfo => {
      let typeUrl = {}
      urlInfo.forEach(info => {
        typeUrl[info.type] = info.url
      })
      cb(typeUrl)
    })
  },

  getPic(songInfo) {
    if (this._musicPicIndex != null) {
      cancelHttp(this._musicPicIndex)
      this._musicPicPromiseCancelFn(new Error('取消http请求'))
    }
    return new Promise((resolve, reject) => {
      this._musicPicPromiseCancelFn = reject
      this._musicPicIndex = httpGet(`https://v1.itooi.cn/kuwo/pic?id=${songInfo.songmid}&isRedirect=0`, (err, resp, body) => {
        this._musicPicIndex = null
        this._musicPicPromiseCancelFn = null
        if (err) {
          console.log(err)
          reject(err)
        }
        console.log(body)
        body.code === 200 ? resolve(body.data) : reject(new Error(body.msg))
      })
    })
  },
}

export default kw
