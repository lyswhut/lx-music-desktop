import { ref, computed } from '@common/utils/vueTools'
import { playMusicInfo, playInfo } from '@renderer/store/player/state'
import { downloadStatus } from '@renderer/store/download/state'
import { getDownloadList } from '@renderer/store/download/action'
import { LIST_IDS } from '@common/constants'


export default (activeTab) => {
  const rightClickSelectedIndex = ref(-1)
  const dom_listContent = ref(null)

  const listAll = ref([])
  getDownloadList().then(l => {
    listAll.value = l
  })

  const list = computed(() => {
    switch (activeTab.value) {
      case 'runing':
        return listAll.value.filter(i => i.status == downloadStatus.RUN || i.status == downloadStatus.WAITING)
      case 'paused':
        return listAll.value.filter(i => i.status == downloadStatus.PAUSE)
      case 'error':
        return listAll.value.filter(i => i.status == downloadStatus.ERROR)
      case 'finished':
        return listAll.value.filter(i => i.status == downloadStatus.COMPLETED)
      default:
        return [...listAll.value]
    }
  })

  const playTaskId = computed(() => playMusicInfo.listId == LIST_IDS.DOWNLOAD ? listAll.value[playInfo.playIndex]?.id : '')


  return {
    rightClickSelectedIndex,
    dom_listContent,
    listAll,
    list,
    playTaskId,
  }
}
