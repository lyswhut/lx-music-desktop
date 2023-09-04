import { useRouter } from '@common/utils/vueRouter'
import musicSdk from '@renderer/utils/musicSdk'
import { openUrl } from '@common/utils/electron'
import { toOldMusicInfo } from '@renderer/utils'
import { addDislikeInfo, hasDislike } from '@renderer/core/dislikeList'
import { playNext } from '@renderer/core/player'
import { playMusicInfo } from '@renderer/store/player/state'


export default ({ props }) => {
  const router = useRouter()

  const handleSearch = index => {
    const info = props.list[index]
    router.push({
      path: '/search',
      query: {
        text: `${info.name} ${info.singer}`,
      },
    })
  }

  const handleOpenMusicDetail = index => {
    const minfo = props.list[index]
    const url = musicSdk[minfo.source]?.getMusicDetailPageUrl?.(toOldMusicInfo(minfo))
    if (!url) return
    openUrl(url)
  }

  const handleDislikeMusic = async(index) => {
    const minfo = props.list[index]
    await addDislikeInfo([{ name: minfo.name, singer: minfo.singer }])
    if (!playMusicInfo.isTempPlay && hasDislike(playMusicInfo.musicInfo)) {
      playNext(true)
    }
  }


  return {
    handleSearch,
    handleOpenMusicDetail,
    handleDislikeMusic,
  }
}
