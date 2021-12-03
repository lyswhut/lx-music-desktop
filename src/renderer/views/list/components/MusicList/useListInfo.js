import { ref, watch, useRefGetter, computed } from '@renderer/utils/vueTools'
import { playMusicInfo, playInfo } from '@renderer/core/share/player'
import { getList } from '@renderer/core/share/utils'


export default ({ props }) => {
  const setting = useRefGetter('setting')

  const rightClickSelectedIndex = ref(-1)
  const selectedIndex = ref(-1)
  const dom_listContent = ref(null)
  const listRef = ref(null)

  const excludeListIds = computed(() => ([props.listId]))


  const list = ref(getList(props.listId))
  watch(() => props.listId, id => {
    list.value = getList(id)
  })

  const playerInfo = computed(() => ({
    isPlayList: playMusicInfo.listId == props.listId,
    playIndex: playInfo.playIndex,
  }))

  const setSelectedIndex = index => {
    selectedIndex.value = index
  }

  const isShowSource = computed(() => setting.value.list.isShowSource)

  return {
    rightClickSelectedIndex,
    selectedIndex,
    dom_listContent,
    listRef,
    list,
    playerInfo,
    setSelectedIndex,
    setting,
    isShowSource,
    excludeListIds,
  }
}
