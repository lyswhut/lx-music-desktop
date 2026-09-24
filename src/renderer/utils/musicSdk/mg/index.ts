import { apis } from '../api-source'
import leaderboard from './leaderboard'
import songList from './songList'
import musicSearch from './musicSearch'
import pic from './pic'
import lyric from './lyric'
import hotSearch from './hotSearch'
import comment from './comment'
// import tipSearch from './tipSearch'

const mg = {
  // tipSearch,
  songList,
  musicSearch,
  leaderboard,
  hotSearch,
  comment,
  getMusicUrl(songInfo: any, type: string): any {
    return apis('mg').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo: any): any {
    return lyric.getLyric(songInfo)
  },
  getPic(songInfo: any): any {
    return pic.getPic(songInfo)
  },
  getMusicDetailPageUrl(songInfo: any): string {
    return `http://music.migu.cn/v3/music/song/${songInfo.copyrightId}`
  },
}

export default mg
