// 为 open API 注册 tx/wy 搜索 & 播放 IPC handler
// Main 进程通过 mainSend → rendererOn → rendererInvoke 回调模式调用

import { rendererInvoke, rendererOn } from '@common/rendererIpc'
import music from '@renderer/utils/musicSdk'
import { toNewMusicInfo, deduplicationList } from '@renderer/utils'
import { markRaw } from '@common/utils/vueTools'
import { setPlayMusicInfo, setPlayListId, setMusicInfo } from '@renderer/store/player/action'
import { allMusicList } from '@renderer/store/list/state'
import { setMusicUrl } from '@renderer/core/player'
import { setPlay, setStop } from '@renderer/plugins/player'
import { playInfo, playMusicInfo, musicInfo as _musicInfo } from '@renderer/store/player/state'
import { getPicPath, getLyricInfo } from '@renderer/core/music'

// ========== 搜索 ==========

const channelSearchRequest = 'open_api:search_request'
const channelSearchResult = 'open_api:search_result'

const handleSearch = async({ requestId, source, keyword, page, limit }: {
  requestId: number; source: string; keyword: string; page: number; limit: number
}) => {
  try {
    const sdk = music[source as keyof typeof music] as any
    if (!sdk?.musicSearch?.search) {
      await rendererInvoke(channelSearchResult, { requestId, error: `Source ${source} not available` })
      return
    }
    const data = await sdk.musicSearch.search(keyword, page, limit)
    data.list = deduplicationList(data.list.map((s: any) => markRaw(toNewMusicInfo(s))))
    await rendererInvoke(channelSearchResult, { requestId, result: data })
  } catch (e: any) {
    await rendererInvoke(channelSearchResult, { requestId, error: e.message || 'Search failed' })
  }
}

// ========== 播放 ==========

const channelPlayRequest = 'open_api:play_request'
const channelPlayResult = 'open_api:play_result'

const handlePlay = async({ requestId, listId, musicInfo, songs }: {
  requestId: number; listId: string; musicInfo: any; songs?: any[]
}) => {
  try {
    if (songs && songs.length) {
      allMusicList.set(listId, songs)
    }
    setPlayListId(listId)
    setPlayMusicInfo(listId, musicInfo, false)
    window.lx.isPlayedStop &&= false
    setStop()
    window.app_event.pause()
    await setMusicUrl(musicInfo)
    // URL loaded, now play
    setPlay()
    // Load pic & lyric (fire-and-forget, same as internal handlePlay)
    void getPicPath({ musicInfo, listId: playMusicInfo.listId }).then((url: string) => {
      if (musicInfo.id != playMusicInfo.musicInfo?.id || url == _musicInfo.pic) return
      setMusicInfo({ pic: url })
      window.app_event.picUpdated()
    }).catch(_ => _)
    void getLyricInfo({ musicInfo }).then((lyricInfo) => {
      if (musicInfo.id != playMusicInfo.musicInfo?.id) return
      setMusicInfo({
        lrc: lyricInfo.lyric,
        tlrc: lyricInfo.tlyric,
        lxlrc: lyricInfo.lxlyric,
        rlrc: lyricInfo.rlyric,
        rawlrc: lyricInfo.rawlrcInfo.lyric,
      })
      window.app_event.lyricUpdated()
    }).catch(_ => _)
    await rendererInvoke(channelPlayResult, { requestId, result: { ok: true } })
  } catch (e: any) {
    await rendererInvoke(channelPlayResult, { requestId, error: e.message || 'Play failed' })
  }
}

// ========== 播放队列 ==========

const channelQueueRequest = 'open_api:queue_request'
const channelQueueResult = 'open_api:queue_result'

const handleQueue = async({ requestId }: { requestId: number }) => {
  try {
    const listId = playInfo.playerListId
    const currentIndex = playInfo.playIndex
    const list = listId ? (allMusicList.get(listId) ?? []) : []
    await rendererInvoke(channelQueueResult, {
      requestId,
      result: { listId: listId ?? null, currentIndex, count: list.length, list },
    })
  } catch (e: any) {
    await rendererInvoke(channelQueueResult, { requestId, error: e.message || 'Queue failed' })
  }
}

// ========== 注册 ==========

export default () => {
  rendererOn<{ requestId: number; source: string; keyword: string; page: number; limit: number }>(
    channelSearchRequest,
    ({ params }) => handleSearch(params).catch(console.error),
  )
  rendererOn<{ requestId: number; listId: string; musicInfo: any }>(
    channelPlayRequest,
    ({ params }) => handlePlay(params).catch(console.error),
  )
  rendererOn<{ requestId: number }>(
    channelQueueRequest,
    ({ params }) => handleQueue(params).catch(console.error),
  )
}
