import { onBeforeUnmount } from '@renderer/utils/vueTools'

import { player as eventPlayerNames, list as eventListNames, download as eventDownloadNames } from '@renderer/event/names'
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
      if (getList(playMusicInfo.listId).length && !global.isPlayedStop) {
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

  const handleDownloadListChange = () => {
    handleListChange(['download'])
  }

  window.eventHub.on(eventListNames.listChange, handleListChange)
  window.eventHub.on(eventDownloadNames.listChange, handleDownloadListChange)

  onBeforeUnmount(() => {
    window.eventHub.off(eventListNames.listChange, handleListChange)
    window.eventHub.off(eventDownloadNames.listChange, handleDownloadListChange)
  })
}
