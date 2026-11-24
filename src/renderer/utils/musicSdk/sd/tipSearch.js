import { request } from './api'

export default {
  requestObj: null,
  cancelTipSearch() {
    this.requestObj?.cancelHttp()
    this.requestObj = null
  },
  async search(keyword) {
    this.cancelTipSearch()
    this.requestObj = request('/luna/sug', { params: { q: keyword, sug_scene: 'main', sug_search_id: String(Date.now()) } })
    const body = await this.requestObj.promise
    return (body.sugs ?? []).map(item => item.suggestion).filter(Boolean)
  },
}
