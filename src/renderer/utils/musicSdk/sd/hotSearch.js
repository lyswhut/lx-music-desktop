import { request } from './api'

export default {
  async getList() {
    const body = await request('/luna/search-block', { body: { from_query: '', includes: ['search_chart'] } }).promise
    const list = (body.search_chart_block?.charts ?? []).flatMap(chart => (chart.content ?? []).map(item => item.keyword)).filter(Boolean)
    return { source: 'sd', list: [...new Set(list)].slice(0, 20) }
  },
}
