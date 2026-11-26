import { LIST_IDS } from '@common/constants'
import { ref } from '@common/utils/vueTools'
import { playList } from '@renderer/core/player/action'
import { getListMusics, addListMusics } from '@renderer/store/list/action'
import { addHistoryWord } from '@renderer/store/search/action'
// import { useI18n } from '@renderer/plugins/i18n'
// import { } from '@renderer/store/search/state'
import { search as searchMusic, listInfos, type ListInfo } from '@renderer/store/search/music'
import { assertPlaybackSupport } from '@renderer/core/music/sourceCapabilities'

export type SearchSource = LX.OnlineSource | 'all'

export default () => {
  const listRef = ref<any>(null)

  const listInfo = ref<ListInfo>({
    page: 1,
    maxPage: 0,
    limit: 30,
    total: 0,
    list: [],
    key: null,
    noItemLabel: '',
  })

  let searchVersion = 0
  const search = (text: string, source: SearchSource, page: number) => {
    const version = ++searchVersion
    listInfo.value = listInfos[source] as ListInfo
    if (text.length) void addHistoryWord(text).catch(error => { console.log(error) })
    if (source === 'all' && text.length) {
      // 聚合搜索采用国内源先出、YTM 后补的渐进渲染：切词/翻页起手归顶，避免 YTM 晚到或超时后再次把已滚动用户拉回顶部
      setTimeout(() => {
        if (version === searchVersion && listRef.value) listRef.value.scrollToTop()
      })
    }
    return searchMusic(text, page, source).then((list: LX.Music.MusicInfo[]) => {
      if (version !== searchVersion) return
      if (source === 'all') return
      if (list.length) {
        setTimeout(() => {
          if (version === searchVersion && listRef.value) listRef.value.scrollToTop()
        })
      }
    })
  }

  const handlePlayList = async(index: number) => {
    let targetSong = listInfo.value.list[index]

    if (!assertPlaybackSupport(targetSong.source)) return

    const defaultListMusics = await getListMusics(LIST_IDS.DEFAULT)

    await addListMusics(LIST_IDS.DEFAULT, [targetSong])

    let targetIndex = defaultListMusics.findIndex(s => s.id === targetSong.id)
    if (targetIndex > -1) playList(LIST_IDS.DEFAULT, targetIndex)
  }

  return {
    listRef,
    listInfo,
    search,
    handlePlayList,
  }
}
