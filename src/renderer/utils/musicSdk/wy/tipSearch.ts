import { httpFetch } from '../../request'
import { weapi } from './utils/crypto'
import { formatSingerName } from '../utils'

export default {
  requestObj: null as any,
  cancelTipSearch(): void {
    if (this.requestObj?.cancelHttp) this.requestObj.cancelHttp()
  },
  async tipSearchBySong(str: string): Promise<any[]> {
    this.cancelTipSearch()
    this.requestObj = httpFetch('https://music.163.com/weapi/search/suggest/web', {
      method: 'POST',
      headers: {
        referer: 'https://music.163.com/',
        origin: 'https://music.163.com/',
      },
      form: weapi({
        s: str,
      }),
    })
    return this.requestObj.promise.then(({ statusCode, body }: { statusCode: number, body: any }) => {
      if (statusCode != 200 || body.code != 200) return Promise.reject(new Error('请求失败'))
      return body.result.songs
    })
  },
  handleResult(rawData: any[]): string[] {
    return rawData.map((info) => `${info.name} - ${formatSingerName(info.artists, 'name')}`)
  },
  async search(str: string): Promise<string[]> {
    return this.tipSearchBySong(str).then((result) => this.handleResult(result))
  },
}
