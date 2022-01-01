import { computed, ref, useI18n, useCssModule, nextTick } from '@renderer/utils/vueTools'
import musicSdk from '@renderer/utils/music'

export default ({
  listRef,
  assertApiSupport,
  emit,

  handleShowDownloadModal,
  handlePlayMusic,
  handlePlayMusicLater,
  handleSearch,
  handleShowMusicAddModal,
  handleOpenMusicDetail,
}) => {
  const itemMenuControl = ref({
    play: true,
    addTo: true,
    playLater: true,
    download: true,
    search: true,
    sourceDetail: true,
  })
  const { t } = useI18n()
  const styles = useCssModule()
  const menuLocation = ref({ x: 0, y: 0 })
  const isShowItemMenu = ref(false)

  const menus = computed(() => {
    return [
      {
        name: t('list__play'),
        action: 'play',
        disabled: !itemMenuControl.value.play,
      },
      {
        name: t('list__download'),
        action: 'download',
        disabled: !itemMenuControl.value.download,
      },
      {
        name: t('list__play_later'),
        action: 'playLater',
        disabled: !itemMenuControl.value.playLater,
      },
      {
        name: t('list__search'),
        action: 'search',
        disabled: !itemMenuControl.value.search,
      },
      {
        name: t('list__add_to'),
        action: 'addTo',
        disabled: !itemMenuControl.value.addTo,
      },
      {
        name: t('list__source_detail'),
        action: 'sourceDetail',
        disabled: !itemMenuControl.value.sourceDetail,
      },
    ]
  })

  const showMenu = (event, musicInfo) => {
    itemMenuControl.value.sourceDetail = !!musicSdk[musicInfo.source].getMusicDetailPageUrl
    // this.listMenu.itemMenuControl.play =
    //   this.listMenu.itemMenuControl.playLater =
    itemMenuControl.download = assertApiSupport(musicInfo.source)
    let dom_container = event.target.closest('.' + styles.songList)
    const getOffsetValue = (target, x = 0, y = 0) => {
      if (target === dom_container) return { x, y }
      if (!target) return { x: 0, y: 0 }
      x += target.offsetLeft
      y += target.offsetTop
      return getOffsetValue(target.offsetParent, x, y)
    }
    let { x, y } = getOffsetValue(event.target)
    menuLocation.value.x = x + event.offsetX
    menuLocation.value.y = y + event.offsetY - listRef.value.getScrollTop()
    emit('show-menu')
    nextTick(() => {
      isShowItemMenu.value = true
    })
  }

  const hideMenu = () => {
    isShowItemMenu.value = false
  }

  const menuClick = (action, index) => {
    // console.log(action)
    hideMenu()
    if (!action) return

    switch (action.action) {
      case 'download':
        handleShowDownloadModal(index)
        break
      case 'play':
        handlePlayMusic(index)
        break
      case 'playLater':
        handlePlayMusicLater(index)
        break
      case 'search':
        handleSearch(index)
        break
      case 'addTo':
        handleShowMusicAddModal(index)
        break
      case 'sourceDetail':
        handleOpenMusicDetail(index)
    }
  }

  return {
    menus,
    menuLocation,
    isShowItemMenu,
    showMenu,
    menuClick,
    hideMenu,
  }
}
