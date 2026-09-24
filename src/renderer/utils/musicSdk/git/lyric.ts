import { generateSongId, loadDatabase } from './util'

export default {
  /**
   * 获取歌词
   */
  async getLyric(songInfo: any): Promise<{ lyric: string, tlyric: string, lxlyric: string }> {
    // 从搜索结果中恢复原始数据
    let gitcodeData = songInfo._gitcodeData

    if (!gitcodeData) {
      const database = await loadDatabase()
      gitcodeData = database.find((item: any) => generateSongId(item.relative_path) === songInfo.songmid)
    }

    // 如果元数据中有歌词
    if (gitcodeData?.lyrics) {
      return {
        lyric: gitcodeData.lyrics,
        tlyric: '', // 翻译歌词
        lxlyric: '', // 逐字歌词
      }
    }

    // 返回默认歌词
    return {
      lyric: '[00:00.00]暂无歌词',
      tlyric: '',
      lxlyric: '',
    }
  },
}
