import { ref, nextTick } from '@common/utils/vueTools'

export default ({ selectedList, props }) => {
  const isShowDownload = ref(false)
  const isShowDownloadMultiple = ref(false)
  const musicInfo = ref(null)

  const handleShowDownloadModal = (index, single) => {
    if (selectedList.value.length && !single) {
      isShowDownloadMultiple.value = true
    } else {
      musicInfo.value = props.list[index]
      nextTick(() => {
        isShowDownload.value = true
      })
    }
  }

  return {
    isShowDownload,
    isShowDownloadMultiple,
    selectedDownloadMusicInfo: musicInfo,
    handleShowDownloadModal,
  }
}
