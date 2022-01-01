import { useRouter } from '@renderer/utils/vueTools'
import musicSdk from '@renderer/utils/music'
import { openUrl } from '@renderer/utils'


export default ({ props }) => {
  const router = useRouter()

  const handleSearch = index => {
    const info = props.list[index]
    router.push({
      path: 'search',
      query: {
        text: `${info.name} ${info.singer}`,
      },
    })
  }

  const handleOpenMusicDetail = index => {
    const minfo = props.list[index]
    const url = musicSdk[minfo.source].getMusicDetailPageUrl(minfo)
    if (!url) return
    openUrl(url)
  }

  return {
    handleSearch,
    handleOpenMusicDetail,
  }
}
