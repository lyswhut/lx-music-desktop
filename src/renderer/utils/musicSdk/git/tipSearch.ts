import { loadDatabase, extractNameFromFile } from './util'

export default {
  requestObj: null as { promise: Promise<any>, cancelHttp: () => void } | null,

  async tipSearchByKeyword(str: string): Promise<any[]> {
    this.cancelTipSearch()

    // 创建一个可取消的Promise
    let canceled = false
    const promise: Promise<any[]> = (async() => {
      if (canceled) throw new Error('请求已取消')

      // 加载数据库
      const database = await loadDatabase()

      if (canceled) throw new Error('请求已取消')

      if (!database || database.length === 0) throw new Error('数据库为空')

      // 根据关键词过滤（如果需要）或者随机返回
      const filtered = str
        ? database.filter((item: any) => {
          const title = item.title || extractNameFromFile(item.filename)
          return title.toLowerCase().includes(str.toLowerCase())
        })
        : database

      // 随机打乱并取前5个
      const shuffled = [...filtered].sort(() => Math.random() - 0.5)
      return shuffled.slice(0, 5)
    })()

    this.requestObj = {
      promise,
      cancelHttp: () => {
        canceled = true
      },
    }

    return this.requestObj.promise
  },

  handleResult(rawData: any[]): Array<{ keyword: string, type: string }> {
    return rawData.map((item: any) => ({
      keyword: item.title || extractNameFromFile(item.filename),
      type: 'git',
    }))
  },

  cancelTipSearch(): void {
    this.requestObj?.cancelHttp()
  },

  async search(str: string): Promise<Array<{ keyword: string, type: string }>> {
    return this.tipSearchByKeyword(str).then((result) => this.handleResult(result))
  },
}
