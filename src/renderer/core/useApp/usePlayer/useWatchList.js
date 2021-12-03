import { onBeforeUnmount } from '@renderer/utils/vueTools'

import { player as eventPlayerNames, list as eventListNames } from '@renderer/event/names'
import { playInfo, playMusicInfo, updatePlayIndex } from '@renderer/core/share/player'
import { getList } from '@renderer/core/share/utils'

export default ({ playNext }) => {
  const handleListChange = listIds => {
    if (!listIds.includes(playInfo.playListId) && !listIds.includes(playMusicInfo.listId)) return
    const { playIndex } = updatePlayIndex()
    if (playIndex < 0 && !playMusicInfo.isTempPlay) { // 歌曲被移除
      if (getList(playMusicInfo.listId).length) {
        playNext()
      } else {
        window.eventHub.emit(eventPlayerNames.setStop)
      }
    }
  }

  window.eventHub.on(eventListNames.listChange, handleListChange)

  onBeforeUnmount(() => {
    window.eventHub.off(eventListNames.listChange, handleListChange)
  })
}
