import { loadDatabase, extractNameFromFile } from './util'

export default {
  _requestObj: null as any,
  _cacheData: null as { source: string, list: unknown[] } | null,
  _cacheTime: 0,

  async getList(retryNum: number = 0): Promise<{ source: string, list: unknown[] }> {
    if (retryNum > 2) {
      return Promise.reject(new Error('获取热搜失败，请稍后重试'))
    }

    try {
      // 缓存5分钟，避免频繁读取
      const now = Date.now()
      if (this._cacheData && now - this._cacheTime < 5 * 60 * 1000) {
        return this._cacheData
      }

      // 从数据库获取热搜词
      const database = await loadDatabase()
      if (!database || database.length === 0) {
        console.log('[Hotword] 数据库为空')
        return { source: 'git', list: [] }
      }

      // 统计所有歌曲和歌手，生成热搜词
      const hotWords = new Set<string>()

      // 随机选择一些歌曲作为热搜
      const shuffled = [...database].sort(() => Math.random() - 0.5)
      const selectedSongs = shuffled.slice(0, 15)

      selectedSongs.forEach((item: any) => {
        // 添加歌曲名
        const title = item.title || extractNameFromFile(item.filename)
        if (title && title.length > 1) {
          hotWords.add(title)
        }

        // 添加歌手名
        if (item.artist && item.artist !== '未知歌手' && item.artist.length > 1) {
          hotWords.add(item.artist)
        }
      })

      // 转换为数组并限制数量
      const hotWordsList = Array.from(hotWords).slice(0, 20)

      console.log(`[Hotword] 生成 ${hotWordsList.length} 个热搜词`)

      const result = {
        source: 'git',
        list: hotWordsList,
      }

      // 更新缓存
      this._cacheData = result
      this._cacheTime = now

      return result
    } catch (error: any) {
      // 重试
      if (
        error.message &&
        (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT'))
      ) {
        console.log(`[Hotword] 网络错误，重试 ${retryNum + 1}/3`)
        return this.getList(retryNum + 1)
      }

      // 返回空结果
      return { source: 'git', list: [] }
    }
  },

  // 兼容旧接口
  filterList(rawList: any[]): any[] {
    return rawList.map((item: any) => item.key || item)
  },
}
