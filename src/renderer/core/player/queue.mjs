const isSamePlayItem = (queueItem, playMusicInfo) => {
  if (!queueItem || !playMusicInfo?.musicInfo) return false
  if (queueItem.musicInfo.id !== playMusicInfo.musicInfo.id) return false
  return queueItem.isTempPlay
    ? playMusicInfo.isTempPlay
    : !playMusicInfo.isTempPlay && queueItem.listId === playMusicInfo.listId
}

const createQueueItem = (queueItem, index, section) => ({
  key: `${section}_${queueItem.musicInfo.id}_${index}`,
  index,
  listId: queueItem.listId,
  musicInfo: queueItem.musicInfo,
  isTempPlay: queueItem.isTempPlay,
  isActive: false,
  canRemove: section === 'temp',
  canDrag: section === 'temp',
})

export const buildPlayQueueSections = ({
  tempPlayList = [],
  baseList = [],
  baseListId = null,
  playMusicInfo = null,
}) => {
  const sections = []

  if (tempPlayList.length) {
    sections.push({
      key: 'temp',
      items: tempPlayList.map((item, index) => {
        const queueItem = createQueueItem(item, index, 'temp')
        queueItem.isActive = isSamePlayItem(item, playMusicInfo)
        return queueItem
      }),
    })
  }

  if (baseList.length) {
    sections.push({
      key: 'base',
      items: baseList.map((musicInfo, index) => {
        const item = {
          listId: baseListId,
          musicInfo,
          isTempPlay: false,
        }
        const queueItem = createQueueItem(item, index, 'base')
        queueItem.isActive = isSamePlayItem(item, playMusicInfo)
        return queueItem
      }),
    })
  }

  return sections
}

export const moveTempQueueItem = (list, oldIndex, newIndex) => {
  if (oldIndex === newIndex) return [...list]
  if (oldIndex < 0 || oldIndex >= list.length) return [...list]
  if (newIndex < 0 || newIndex >= list.length) return [...list]

  const nextList = [...list]
  const [target] = nextList.splice(oldIndex, 1)
  nextList.splice(newIndex, 0, target)
  return nextList
}
