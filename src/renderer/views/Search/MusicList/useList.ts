import { LIST_IDS } from '@common/constants'
import { ref } from '@common/utils/vueTools'
import { playList } from '@renderer/core/player/action'
import { getListMusics, addListMusics } from '@renderer/store/list/action'
import { addHistoryWord } from '@renderer/store/search/action'
import { searchText } from '@renderer/store/search/state'
import { deduplicationList } from '@renderer/utils'
// import { useI18n } from '@renderer/plugins/i18n'
// import { } from '@renderer/store/search/state'
import { search as searchMusic, listInfos, type ListInfo } from '@renderer/store/search/music'
import { assertApiSupport } from '@renderer/store/utils'

export type SearchSource = LX.OnlineSource | 'all'

export default (getSourceId: () => SearchSource) => {
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

  const search = (text: string, source: SearchSource, page: number) => {
    listInfo.value = listInfos[source] as ListInfo
    if (text.length) void addHistoryWord(text)
    void searchMusic(text, page, source).then((list: LX.Music.MusicInfo[]) => {
      if (list.length) {
        setTimeout(() => {
          if (listRef.value) listRef.value.scrollToTop()
        })
      }
    })
  }

  const isLoadingMore = ref(false)

  // 无限滚动：加载下一页并追加到当前列表
  const handleLoadMore = async() => {
    const info = listInfo.value
    const source = getSourceId()
    if (isLoadingMore.value || !searchText.value) return
    if (!info.list.length || info.page >= info.maxPage) return
    if (listInfos[source] !== info) return
    isLoadingMore.value = true
    const prevList = info.list.slice()
    const nextPage = info.page + 1
    try {
      const pageList = await searchMusic(searchText.value, nextPage, source)
      if (listInfo.value !== info) return
      info.list = deduplicationList([...prevList, ...pageList])
      info.page = nextPage
    } catch {
      // 加载失败保持原状，可再次滚动重试
    } finally {
      isLoadingMore.value = false
    }
  }

  const handlePlayList = async(index: number) => {
    let targetSong = listInfo.value.list[index]

    if (!assertApiSupport(targetSong.source)) return

    const defaultListMusics = await getListMusics(LIST_IDS.DEFAULT)

    await addListMusics(LIST_IDS.DEFAULT, [targetSong])

    let targetIndex = defaultListMusics.findIndex(s => s.id === targetSong.id)
    if (targetIndex > -1) playList(LIST_IDS.DEFAULT, targetIndex)
  }

  return {
    listRef,
    listInfo,
    search,
    isLoadingMore,
    handleLoadMore,
    handlePlayList,
  }
}
