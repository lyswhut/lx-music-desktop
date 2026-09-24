import leaderboard from './leaderboard'
import songList from './songList'
import hotSearch from './hotSearch'
import tipSearch from './tipSearch'
import musicSearch from './musicSearch'
import lyric from './lyric'
import { GITCODE_CONFIG } from './util'
import { getMusicUrl as _getMusicUrl } from './api'

const git = {
  leaderboard,
  songList,
  hotSearch,
  tipSearch,
  musicSearch,

  getLyric(songInfo: any): { promise: Promise<any> } {
    const requestObj: { promise: Promise<any> } = { promise: lyric.getLyric(songInfo) }
    return requestObj
  },

  getMusicUrl(songInfo: any, type: string): { promise: Promise<any> } {
    const requestObj: { promise: Promise<any> } = { promise: _getMusicUrl(songInfo, type) }
    return requestObj
  },

  getPic(songInfo: any): { promise: Promise<string> } {
    const requestObj: { promise: Promise<string> } = { promise: Promise.resolve(songInfo.img) }
    return requestObj
  },

  /**
   * 获取歌曲详情页URL
   */
  getMusicDetailPageUrl(songInfo: any): string {
    // 返回Gitcode仓库页面
    return `https://gitcode.com/${GITCODE_CONFIG.owner}/${GITCODE_CONFIG.repo}`
  },
}

export default git
