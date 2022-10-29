import { ref, onBeforeUnmount } from '@common/utils/vueTools'

export default ({ setSelectedIndex, handlePlayMusic, listRef }) => {
  const isShowSearchBar = ref(false)
  const searchList = ref([])

  const handleShowSearchBar = () => {
    isShowSearchBar.value = true
  }

  const handleMusicSearchAction = ({ action, data: { index, isPlay } = {} }) => {
    isShowSearchBar.value = false
    switch (action) {
      case 'listClick':
        if (index < 0) return
        listRef.value.scrollToIndex(index, -150, true, () => {
          setSelectedIndex(index)
          setTimeout(() => {
            setSelectedIndex(-1)
            if (isPlay) handlePlayMusic(index)
          }, 600)
        })
        break
    }
  }

  window.key_event.on('key_mod+f_down', handleShowSearchBar)

  onBeforeUnmount(() => {
    window.key_event.off('key_mod+f_down', handleShowSearchBar)
  })

  return {
    isShowSearchBar,
    searchList,
    handleMusicSearchAction,
  }
}
