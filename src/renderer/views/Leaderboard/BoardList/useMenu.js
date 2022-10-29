import { computed, ref, reactive, nextTick } from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'
import { addSongListDetail, playSongListDetail } from '../action'

export default ({
  emit,
  list,
}) => {
  // const menuControl = reactive({
  //   play: true,
  //   collect: true,
  // })
  const t = useI18n()
  const menuLocation = reactive({ x: 0, y: 0 })
  const isShowMenu = ref(false)

  const menus = computed(() => {
    return [
      {
        name: t('list__play'),
        action: 'play',
        disabled: false,
      },
      {
        name: t('list__collect'),
        action: 'collect',
        disabled: false,
      },
    ]
  })


  const showMenu = (event, index) => {
    menuLocation.x = event.pageX
    menuLocation.y = event.pageY

    if (isShowMenu.value) return
    emit('show-menu')
    nextTick(() => {
      isShowMenu.value = true
    })
  }

  const hideMenu = () => {
    isShowMenu.value = false
  }


  const menuClick = (action, index, source) => {
    // console.log(action)
    hideMenu()
    if (!action) return
    // const id = `board__${this.source}__${board.id}`
    const board = list[index]
    switch (action.action) {
      case 'play':
        playSongListDetail(board.id)
        break
      case 'collect':
        addSongListDetail(board.id, board.name, source)
        break
    }
  }

  return {
    menus,
    menuLocation,
    isShowMenu,
    showMenu,
    menuClick,
  }
}
