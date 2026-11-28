import { apis } from '../api-source'
import { trackDetail } from './api'
import { formatTrack, coverUrl } from './utils'
import musicSearch from './musicSearch'
import leaderboard from './leaderboard'
import songList from './songList'
import hotSearch from './hotSearch'
import tipSearch from './tipSearch'
import lyric from './lyric'
import comment from './comment'

export default {
  musicSearch,
  leaderboard,
  songList,
  hotSearch,
  tipSearch,
  comment,
  getMusicUrl(songInfo, type) {
    return apis('sd').getMusicUrl(songInfo, type)
  },
  getLyric(songInfo) {
    return lyric.getLyric(songInfo)
  },
  async getMusicInfo(songInfo) {
    const body = await trackDetail(songInfo.songmid).promise
    const info = formatTrack(body.track)
    if (!info) throw new Error('汽水音乐歌曲信息获取失败')
    return info
  },
  async handleMusicInfo(songInfo) {
    return Object.assign(songInfo, await this.getMusicInfo(songInfo))
  },
  async getPic(songInfo) {
    if (songInfo.img) return songInfo.img
    const body = await trackDetail(songInfo.songmid).promise
    const url = coverUrl(body.track?.album?.url_cover ?? body.track?.url_cover)
    if (!url) throw new Error('汽水音乐封面获取失败')
    return url
  },
  getMusicDetailPageUrl(songInfo) {
    return `https://music.douyin.com/qishui/share/track?track_id=${songInfo.songmid}`
  },
}
