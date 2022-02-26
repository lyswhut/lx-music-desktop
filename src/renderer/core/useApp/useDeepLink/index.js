import { onBeforeUnmount } from '@renderer/utils/vueTools'
import { base as eventBaseName } from '@renderer/event/names'
import { getEnvParams, clearEnvParamsDeeplink } from '@renderer/utils/tools'

import { useDialog } from './utils'
import useMusicAction from './useMusicAction'
import useSonglistAction from './useSonglistAction'

export default () => {
  let isInited = false

  const showErrorDialog = useDialog()

  const handleMusicAction = useMusicAction()
  const handleSonglistAction = useSonglistAction()


  const handleLinkAction = link => {
    // console.log(link)
    const [url, search] = link.split('?')
    const [type, action, ...paths] = url.replace('lxmusic://', '').split('/')
    const params = {}
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
        handleMusicAction(action, params)
        break
      case 'songlist':
        handleSonglistAction(action, params)
        break
      default: throw new Error('Unknown type: ' + type)
    }
  }

  const handleFocus = () => {
    if (!isInited) return

    getEnvParams().then(envParams => {
      if (!envParams.deeplink) return
      clearEnvParamsDeeplink()
      try {
        handleLinkAction(envParams.deeplink)
      } catch (err) {
        showErrorDialog(err.message)
      }
    })
  }

  window.eventHub.on(eventBaseName.focus, handleFocus)

  onBeforeUnmount(() => {
    window.eventHub.off(eventBaseName.focus, handleFocus)
  })

  return envParams => {
    if (envParams.deeplink) {
      clearEnvParamsDeeplink()
      try {
        handleLinkAction(envParams.deeplink)
      } catch (err) {
        showErrorDialog(err.message)
      }
    }
    isInited = true
  }
}
