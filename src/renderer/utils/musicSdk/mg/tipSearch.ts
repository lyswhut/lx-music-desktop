import { createHttpFetch } from './utils'

export default {
  requestObj: null as any,
  cancelTipSearch() {
    if (this.requestObj?.cancelHttp) this.requestObj.cancelHttp()
  },
  tipSearchBySong(str: string) {
    this.cancelTipSearch()
    this.requestObj = createHttpFetch(
      `https://music.migu.cn/v3/api/search/suggest?keyword=${encodeURIComponent(str)}`,
      {
        headers: {
          referer: 'https://music.migu.cn/v3',
        },
      },
    )
    return this.requestObj.then((body: any) => {
      return body.songs
    })
  },
  handleResult(rawData: any[]) {
    return rawData.map((info: any) => `${info.name} - ${info.singerName}`)
  },
  async search(str: string) {
    return this.tipSearchBySong(str).then((result: any) => this.handleResult(result))
  },
}
