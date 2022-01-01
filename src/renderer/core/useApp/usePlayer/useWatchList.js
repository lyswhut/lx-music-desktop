import { onBeforeUnmount } from '@renderer/utils/vueTools'

import { player as eventPlayerNames, list as eventListNames } from '@renderer/event/names'
import { playInfo, playMusicInfo, updatePlayIndex } from '@renderer/core/share/player'
import { getList } from '@renderer/core/share/utils'
import { throttle } from '@renderer/utils'

const changedListIds = new Set()

export default ({ playNext }) => {
  const throttleListChange = throttle(() => {
    const isSkip = !changedListIds.has(playInfo.playListId) && !changedListIds.has(playMusicInfo.listId)
    changedListIds.clear()
    if (isSkip) return

    const { playIndex } = updatePlayIndex()
    if (playIndex < 0 && !playMusicInfo.isTempPlay) { // 歌曲被移除
      if (getList(playMusicInfo.listId).length) {
        playNext()
      } else {
        window.eventHub.emit(eventPlayerNames.setStop)
      }
    }
  })

  const handleListChange = listIds => {
    for (const id of listIds) {
      changedListIds.add(id)
    }
    throttleListChange()
  }

  window.eventHub.on(eventListNames.listChange, handleListChange)

  onBeforeUnmount(() => {
    window.eventHub.off(eventListNames.listChange, handleListChange)
  })
}
