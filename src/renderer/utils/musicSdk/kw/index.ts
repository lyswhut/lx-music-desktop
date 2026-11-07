import { httpFetch } from '../../request'
import tipSearch from './tipSearch'
import musicSearch from './musicSearch'
import { formatSinger } from './util'
import leaderboard from './leaderboard'
import lyric from './lyric'
import pic from './pic'
import { apis } from '../api-source'
import songList from './songList'
import hotSearch from './hotSearch'
import comment from './comment'

const kw = {
  _musicInfoRequestObj: null as any,
  _musicInfoPromiseCancelFn: null as any,
  _musicPicRequestObj: null as any,
  _musicPicPromiseCancelFn: null as any,
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

  tipSearch,
  musicSearch,
  leaderboard,
  songList,
  hotSearch,
  comment,
  getLyric(songInfo: any, isGetLyricx: boolean): any {
    // let singer = songInfo.singer.indexOf('、') > -1 ? songInfo.singer.split('、')[0] : songInfo.singer
    return lyric.getLyric(songInfo, isGetLyricx)
  },
  async handleMusicInfo(songInfo: any): Promise<any> {
    return this.getMusicInfo(songInfo).then((info: any) => {
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

  getMusicUrl(songInfo: any, type: string): any {
    return apis('kw').getMusicUrl(songInfo, type)
  },

  async getMusicInfo(songInfo: any): Promise<any> {
    if (this._musicInfoRequestObj) this._musicInfoRequestObj.cancelHttp()
    this._musicInfoRequestObj = httpFetch(
      `http://www.kuwo.cn/api/www/music/musicInfo?mid=${songInfo.songmid}`,
    )
    return this._musicInfoRequestObj.promise.then(({ body }: { body: any }) => {
      return body.code === 200 ? body.data : Promise.reject(new Error(body.msg))
    })
  },

  getMusicUrls(musicInfo: any, cb: (typeUrl: Record<string, string>) => void): void {
    let tasks: Array<Promise<any>> = []
    let songId = musicInfo.songmid
    musicInfo.types.forEach((type: any) => {
      tasks.push(kw.getMusicUrl(songId, type.type).promise)
    })
    void Promise.all(tasks).then((urlInfo: any[]) => {
      let typeUrl: Record<string, string> = {}
      urlInfo.forEach((info: any) => {
        typeUrl[info.type] = info.url
      })
      cb(typeUrl)
    })
  },

  async getPic(songInfo: any): Promise<string | null> {
    return pic.getPic(songInfo)
  },

  getMusicDetailPageUrl(songInfo: any): string {
    return `http://www.kuwo.cn/play_detail/${songInfo.songmid}`
  },

  // init() {
  //   return getToken()
  // },
}

export default kw
