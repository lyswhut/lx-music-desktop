import { useCommit, useRouter } from '@renderer/utils/vueTools'
import musicSdk from '@renderer/utils/music'
import { openUrl, clipboardWriteText } from '@renderer/utils'


export default ({ props, list, setting, selectedList, removeAllSelect }) => {
  const router = useRouter()

  const listRemove = useCommit('list', 'listRemove')
  const listRemoveMultiple = useCommit('list', 'listRemoveMultiple')

  const handleSearch = index => {
    const info = list.value[index]
    router.push({
      path: 'search',
      query: {
        text: `${info.name} ${info.singer}`,
      },
    })
  }

  const handleOpenMusicDetail = index => {
    const minfo = list.value[index]
    const url = musicSdk[minfo.source].getMusicDetailPageUrl(minfo)
    if (!url) return
    openUrl(url)
  }

  const handleCopyName = index => {
    const minfo = list.value[index]
    clipboardWriteText(setting.value.download.fileName.replace('歌名', minfo.name).replace('歌手', minfo.singer))
  }

  const handleRemoveMusic = (index, single) => {
    if (selectedList.value.length && !single) {
      listRemoveMultiple({ listId: props.listId, ids: selectedList.value.map(m => m.songmid) })
      removeAllSelect()
    } else {
      listRemove({ listId: props.listId, id: list.value[index].songmid })
    }
  }

  return {
    handleSearch,
    handleOpenMusicDetail,
    handleCopyName,
    handleRemoveMusic,
  }
}
