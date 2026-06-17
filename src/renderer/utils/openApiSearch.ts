// 为 open API 注册 tx/wy 搜索 IPC handler
// Main 进程通过 mainSend → rendererOn → rendererInvoke 回调模式调用

import { rendererInvoke, rendererOn } from '@common/rendererIpc'
import music from '@renderer/utils/musicSdk'
import { toNewMusicInfo, deduplicationList } from '@renderer/utils'
import { markRaw } from '@common/utils/vueTools'

const channelRequest = 'open_api:search_request'
const channelResult = 'open_api:search_result'

const handleSearch = async({ requestId, source, keyword, page, limit }: {
  requestId: number
  source: string
  keyword: string
  page: number
  limit: number
}) => {
  try {
    const sdk = music[source as keyof typeof music] as any
    if (!sdk?.musicSearch?.search) {
      await rendererInvoke(channelResult, { requestId, error: `Source ${source} not available` })
      return
    }
    const data = await sdk.musicSearch.search(keyword, page, limit)
    // 转换为标准的 MusicInfo 格式（带 meta）
    data.list = deduplicationList(data.list.map((s: any) => markRaw(toNewMusicInfo(s))))
    await rendererInvoke(channelResult, { requestId, result: data })
  } catch (e: any) {
    await rendererInvoke(channelResult, { requestId, error: e.message || 'Search failed' })
  }
}

export default () => {
  rendererOn<{ requestId: number; source: string; keyword: string; page: number; limit: number }>(
    channelRequest,
    ({ params }) => handleSearch(params).catch(console.error),
  )
}
