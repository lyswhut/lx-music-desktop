import {
  loadDatabase,
  generateAlbumId,
  generateSongId,
  getInterval,
  extractNameFromFile,
  getTypes,
  get_Types,
} from './util'

export default {
  // 搜索相关
  limit: 30,
  total: 0,
  page: 0,
  allPage: 1,

  /**
   * 处理搜索结果
   */
  handleResult(searchResults: any[], page: number, limit: number): any[] {
    // 分页处理
    this.total = searchResults.length
    this.allPage = Math.ceil(this.total / limit)
    this.page = page

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const pageResults = searchResults.slice(startIndex, endIndex)

    // 格式化结果
    const list = pageResults.map((item: any) => ({
      name: item.title || extractNameFromFile(item.filename),
      singer: item.artist || '未知歌手',
      source: 'git',
      songmid: generateSongId(item.relative_path),
      albumId: generateAlbumId(item.album || ''),
      interval: getInterval(item),
      albumName: item.album || '未知专辑',
      lrc: null,
      img: item.img,
      otherSource: null,
      types: getTypes(item),
      _types: get_Types(item),
      typeUrl: {},
      // 保存原始数据供后续使用
      _gitcodeData: item,
    }))

    return list
  },

  /**
   * 搜索音乐 - 主搜索函数
   */
  async search(keyword: string, page: number = 1, limit: number | null, retryNum: number = 0): Promise<any> {
    // 错误重试
    if (retryNum > 2) {
      return Promise.reject(new Error('搜索失败，请稍后重试'))
    }

    if (limit == null) limit = this.limit

    try {
      console.log(`[Gitcode] 搜索关键词: ${keyword}, 页码: ${page}, 限制: ${limit}`)

      // 确保数据库已加载
      const database = await loadDatabase()

      if (!database || database.length === 0) {
        console.log('[Gitcode] 数据库为空或未加载')
        return Promise.resolve({
          list: [],
          allPage: 0,
          total: 0,
          limit,
          source: 'git',
        })
      }

      // 搜索逻辑
      const searchResults = database.filter((item: any) => {
        const searchFields: string[] = [
          item.title || '',
          item.artist || '',
          item.album || '',
          item.filename || '',
        ].map((field: string) => field.toLowerCase())

        const keywords: string[] = keyword.toLowerCase().split(/\s+/)
        return keywords.every((git: string) => searchFields.some((field: string) => field.includes(git)))
      })

      console.log(`[Gitcode] 找到 ${searchResults.length} 个结果`)

      // 处理结果
      const list = this.handleResult(searchResults, page, limit)
      console.log(list)
      // 返回格式化的结果
      return Promise.resolve({
        list,
        allPage: this.allPage,
        total: this.total,
        limit,
        source: 'git',
      })
    } catch (error: any) {
      // 重试
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        console.log(`[Gitcode] 网络错误，重试 ${retryNum + 1}/3`)
        return this.search(keyword, page, limit, retryNum + 1)
      }

      // 返回空结果而不是抛出错误
      return Promise.resolve({
        list: [],
        allPage: 0,
        total: 0,
        limit,
        source: 'git',
      })
    }
  },
}
