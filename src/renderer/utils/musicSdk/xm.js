// import { apis } from '../api-source'
// import leaderboard from './leaderboard'
// import songList from './songList'
// import musicSearch from './musicSearch'
// import pic from './pic'
// import lyric from './lyric'
// import hotSearch from './hotSearch'
// import comment from './comment'
// import musicInfo from './musicInfo'
// import { closeVerifyModal } from './util'

const xm = {
  // songList,
  // musicSearch,
  // leaderboard,
  // hotSearch,
  // closeVerifyModal,
  comment: {
    getComment() {
      return Promise.reject(new Error('fail'))
    },
    getHotComment() {
      return Promise.reject(new Error('fail'))
    },
  },
  getMusicUrl(songInfo, type) {
    return {
      promise: Promise.reject(new Error('fail')),
    }
    // return apis('xm').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    return {
      promise: Promise.reject(new Error('fail')),
    }
    // return lyric.getLyric(songInfo)
  },
  getPic(songInfo) {
    return Promise.reject(new Error('fail'))
    // return pic.getPic(songInfo)
  },
  // getMusicDetailPageUrl(songInfo) {
  //   if (songInfo.songStringId) return `https://www.xiami.com/song/${songInfo.songStringId}`

  //   musicInfo.getMusicInfo(songInfo).then(({ data }) => {
  //     songInfo.songStringId = data.songStringId
  //   })
  //   return `https://www.xiami.com/song/${songInfo.songmid}`
  // },
  // init() {
  //   getToken()
  // },
}

export default xm
