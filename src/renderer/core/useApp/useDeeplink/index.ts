import { onBeforeUnmount } from '@common/utils/vueTools'
import { clearEnvParamsDeeplink, focusWindow, onDeeplink } from '@renderer/utils/ipc'

import { useDialog } from './utils'
import useMusicAction from './useMusicAction'
import useSonglistAction from './useSonglistAction'
import usePlayerAction from './usePlayerAction'

export default () => {
  let isInited = false

  const showErrorDialog = useDialog()

  const handleMusicAction = useMusicAction()
  const handleSonglistAction = useSonglistAction()
  const handlePlayerAction = usePlayerAction()


  const handleLinkAction = async(link: string) => {
    // console.log(link)
    const [url, search] = link.split('?')
    const [type, action, ...paths] = url.replace('lxmusic://', '').split('/')
    const params: {
      paths: string[]
      data?: any
      [key: string]: any
    } = {
      paths: [],
    }
    if (search) {
      for (const param of search.split('&')) {
        const [key, value] = param.split('=')
        params[key] = value
      }
      if (params.data) params.data = JSON.parse(decodeURIComponent(params.data))
    }
    params.paths = paths.map(p => decodeURIComponent(p))
    console.log(params)
    switch (type) {
      case 'music':
        await handleMusicAction(action, params)
        break
      case 'songlist':
        await handleSonglistAction(action, params)
        break
      case 'player':
        await handlePlayerAction(action as any)
        break
      default: throw new Error('Unknown type: ' + type)
    }
  }

  const rDeeplink = onDeeplink(async({ params: link }) => {
    console.log(link)
    if (!isInited) return
    clearEnvParamsDeeplink()
    try {
      await handleLinkAction(link)
    } catch (err: any) {
      showErrorDialog(err.message)
      focusWindow()
    }
  })

  onBeforeUnmount(() => {
    rDeeplink()
  })

  return async(envParams: LX.EnvParams) => {
    if (envParams.deeplink) {
      clearEnvParamsDeeplink()
      try {
        await handleLinkAction(envParams.deeplink)
      } catch (err: any) {
        showErrorDialog(err.message)
        focusWindow()
      }
    }
    isInited = true
  }
}
