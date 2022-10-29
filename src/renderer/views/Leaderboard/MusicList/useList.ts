import { ref } from '@common/utils/vueTools'
// import { useI18n } from '@renderer/plugins/i18n'
// import { } from '@renderer/store/search/state'
import { getAndSetListDetail } from '@renderer/store/leaderboard/action'
import { listDetailInfo } from '@renderer/store/leaderboard/state'
import { playSongListDetail } from '../action'

export default () => {
  const listRef = ref<any>(null)

  const handlePlayList = (index: number) => {
    void playSongListDetail(listDetailInfo.id, listDetailInfo.list, index)
  }

  const getList = (id: string, page: number) => {
    void getAndSetListDetail(id, page).then(() => {
      setTimeout(() => {
        if (listRef.value) listRef.value.scrollToTop()
      })
    })
  }

  return {
    listRef,
    listDetailInfo,
    getList,
    handlePlayList,
  }
}
