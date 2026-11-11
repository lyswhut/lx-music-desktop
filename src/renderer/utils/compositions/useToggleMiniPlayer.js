import { ref } from '@common/utils/vueTools'
import { toggleMiniPlayer as sendToggleMiniPlayer, onMiniPlayerVisibleChanged } from '@renderer/utils/ipc'

// 记录迷你窗当前是否显示，跨组件共享同一份状态
const isMiniPlayerShow = ref(false)
let isInited = false

export default () => {
  if (!isInited) {
    isInited = true
    // 同步主进程侧实际的窗口状态（窗口被关闭时同步按钮状态）
    onMiniPlayerVisibleChanged(({ params: isShow }) => {
      isMiniPlayerShow.value = isShow
    })
  }

  const toggleMiniPlayer = async() => {
    isMiniPlayerShow.value = await sendToggleMiniPlayer()
  }

  return {
    isMiniPlayerShow,
    toggleMiniPlayer,
  }
}
