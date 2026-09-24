import { loadDatabase, generateSongId, buildDownloadUrl } from './util'


/**
 * 获取音乐URL
 */
export const getMusicUrl = async(songInfo: any, type: string): Promise<{ type: string, url: string }> => {
  // 从搜索结果中恢复原始数据
  let gitcodeData = songInfo._gitcodeData

  // 如果没有缓存数据，重新搜索
  if (!gitcodeData) {
    const database = await loadDatabase()
    gitcodeData = database.find((item: any) => generateSongId(item.relative_path) === songInfo.songmid)
  }

  if (!gitcodeData) {
    return Promise.reject(new Error('找不到歌曲信息'))
  }

  return Promise.resolve({
    type,
    url: gitcodeData.download_url || buildDownloadUrl(gitcodeData.relative_path),
  })
}
