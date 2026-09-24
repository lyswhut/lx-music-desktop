import { createHttpFetch } from './util'

export default {
  requestObj: null as any,
  cancelTipSearch(): void {
    if (this.requestObj?.cancelHttp) this.requestObj.cancelHttp()
  },
  async tipSearchBySong(str: string): Promise<any> {
    this.cancelTipSearch()
    this.requestObj = createHttpFetch(
      `https://searchtip.kugou.com/getSearchTip?MusicTipCount=10&keyword=${encodeURIComponent(str)}`,
      {
        headers: {
          referer: 'https://www.kugou.com/',
        },
      },
    )
    return this.requestObj.then((body: any) => {
      return body[0].RecordDatas
    })
  },
  handleResult(rawData: any[]): string[] {
    return rawData.map((info: any) => info.HintInfo)
  },
  async search(str: string): Promise<string[]> {
    return this.tipSearchBySong(str).then((result: any[]) => this.handleResult(result))
  },
}
