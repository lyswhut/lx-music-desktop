// DSH Bridge：接收主进程 openApi 中 /dsh/* 端点转发过来的请求，
// 复用渲染进程里现成的搜索源与播放逻辑，然后把结果回传给主进程。
// 这里不新增任何音源实现，只做转发与字段整理。详细说明见 docs/DSH_BRIDGE.md。
import { onBeforeUnmount } from '@common/utils/vueTools'
import { rendererOff, rendererOn, rendererSend } from '@common/rendererIpc'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { toOldMusicInfo } from '@common/utils/tools'
import music from '@renderer/utils/musicSdk'

import { usePlayMusic, useSearchPlayMusic } from './useDeeplink/useMusicAction'

const DEFAULT_SEARCH_LIMIT = 10
const MAX_SEARCH_LIMIT = 30

const sdk = music as any

/**
 * 复用搜索页/搜索源本身的实现：对指定源（或全部源）发起一次第 1 页的搜索。
 * 只调用搜索源，不写入搜索页的列表状态，避免影响 UI。
 */
const search = async(keywords: string, source: LX.OnlineSource | 'all', limit: number): Promise<LX.DshBridge.SearchItem[]> => {
  let sourceIds: string[]
  if (source == 'all') {
    sourceIds = (sdk.sources as Array<{ id: string }>)
      .map(item => item.id)
      .filter(id => sdk[id]?.musicSearch != null)
  } else {
    if (sdk[source]?.musicSearch == null) throw new Error(`source not supported: ${source}`)
    sourceIds = [source]
  }

  const results = await Promise.all(sourceIds.map(async id => {
    try {
      return await (sdk[id].musicSearch.search(keywords, 1, limit) as Promise<any>)
    } catch (error: any) {
      console.log(`dsh bridge search error [${id}]:`, error?.message ?? error)
      return null
    }
  }))

  const list: LX.DshBridge.SearchItem[] = []
  for (const result of results) {
    if (!result?.list) continue
    for (const item of result.list) {
      list.push({
        source: item.source,
        songmid: item.songmid,
        name: item.name,
        singer: item.singer,
        albumName: item.albumName ?? '',
        interval: item.interval ?? '',
        img: item.img ?? null,
        types: item.types ?? [],
        raw: item,
      })
    }
  }
  return list
}

export default () => {
  const handlePlayMusic = usePlayMusic()
  const handleSearchPlayMusic = useSearchPlayMusic()

  const handleRequest = async(request: LX.DshBridge.Request): Promise<LX.DshBridge.Response> => {
    const { id, action, params = {} } = request
    try {
      switch (action) {
        case 'search': {
          const keywords = params.keywords?.trim() ?? ''
          if (!keywords) return { id, ok: false, code: 'INVALID_PARAMS', error: 'keywords is required' }
          const limit = Math.min(Math.max(params.limit ?? DEFAULT_SEARCH_LIMIT, 1), MAX_SEARCH_LIMIT)
          const list = await search(keywords, params.source ?? 'all', limit)
          return { id, ok: true, data: { list } }
        }
        case 'play': {
          if (!params.data) return { id, ok: false, code: 'INVALID_PARAMS', error: 'data is required' }
          // 与 music/play deeplink 走同一套校验、添加临时播放列表与播放逻辑
          handlePlayMusic({ data: params.data })
          return { id, ok: true, data: {} }
        }
        case 'searchPlay': {
          const name = params.name?.trim() ?? ''
          if (!name) return { id, ok: false, code: 'INVALID_PARAMS', error: 'name is required' }
          // 与 music/searchPlay deeplink 走同一套跨源匹配逻辑
          const musicInfo = await handleSearchPlayMusic({
            paths: [],
            data: {
              name,
              singer: params.singer ?? '',
            },
          })
          if (!musicInfo) return { id, ok: false, code: 'NOT_FOUND', error: 'music not found' }
          return { id, ok: true, data: { musicInfo: toOldMusicInfo(musicInfo) } }
        }
        default:
          return { id, ok: false, code: 'INVALID_PARAMS', error: `unknown action: ${action as string}` }
      }
    } catch (error: any) {
      console.log('dsh bridge request error:', error)
      return { id, ok: false, code: 'INTERNAL_ERROR', error: error?.message ?? String(error) }
    }
  }

  const listener = ({ params }: LX.IpcRendererEventParams<LX.DshBridge.Request>) => {
    void handleRequest(params).then(response => {
      rendererSend(WIN_MAIN_RENDERER_EVENT_NAME.dsh_bridge_response, response)
    })
  }

  rendererOn<LX.DshBridge.Request>(WIN_MAIN_RENDERER_EVENT_NAME.dsh_bridge_request, listener)

  onBeforeUnmount(() => {
    rendererOff(WIN_MAIN_RENDERER_EVENT_NAME.dsh_bridge_request, listener)
  })
}
