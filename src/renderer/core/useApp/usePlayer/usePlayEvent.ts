import { onBeforeUnmount } from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'
import { musicInfo, playMusicInfo } from '@renderer/store/player/state'
import { setStop, isEmpty } from '@renderer/plugins/player'
import { playNext, setMusicUrl } from '@renderer/core/player'
import { setAllStatus } from '@renderer/store/player/action'
import { appSetting } from '@renderer/store/setting'

export default () => {
  const t = useI18n()
  let retryNum = 0
  let prevTimeoutId: string | null = null

  let loadingTimeout: NodeJS.Timeout | null = null
  let delayNextTimeout: NodeJS.Timeout | null = null
  const startLoadingTimeout = () => {
    // console.log('start load timeout')
    clearLoadingTimeout()
    loadingTimeout = setTimeout(() => {
      if (window.lx.isPlayedStop) {
        prevTimeoutId = null
        setAllStatus('')
        return
      }

      // 如果加载超时，则尝试刷新URL
      if (prevTimeoutId == musicInfo.id) {
        prevTimeoutId = null
        void playNext(true)
      } else {
        prevTimeoutId = musicInfo.id
        if (playMusicInfo.musicInfo) setMusicUrl(playMusicInfo.musicInfo, true)
      }
    }, 25000)
  }
  const clearLoadingTimeout = () => {
    if (!loadingTimeout) return
    // console.log('clear load timeout')
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }

  const clearDelayNextTimeout = () => {
    // console.log(this.delayNextTimeout)
    if (!delayNextTimeout) return
    clearTimeout(delayNextTimeout)
    delayNextTimeout = null
  }
  const addDelayNextTimeout = () => {
    clearDelayNextTimeout()
    delayNextTimeout = setTimeout(() => {
      if (window.lx.isPlayedStop) {
        setAllStatus('')
        return
      }
      void playNext(true)
    }, 5000)
  }

  const handleLoadstart = () => {
    if (window.lx.isPlayedStop) return
    if (appSetting['player.autoSkipOnError']) startLoadingTimeout()
    setAllStatus(t('player__loading'))
  }

  const handleLoadeddata = () => {
    setAllStatus(t('player__loading'))
  }

  const handlePlaying = () => {
    setAllStatus('')
    clearLoadingTimeout()
  }

  const handleEmpied = () => {
    clearDelayNextTimeout()
    clearLoadingTimeout()
  }

  const handleWating = () => {
    setAllStatus(t('player__buffering'))
  }

  const handleError = (errCode?: number) => {
    if (!musicInfo.id) return
    clearLoadingTimeout()
    if (window.lx.isPlayedStop) return
    if (!isEmpty()) setStop()
    if (playMusicInfo.musicInfo && errCode !== 1 && retryNum < 2) { // 若音频URL无效则尝试刷新2次URL
      // console.log(this.retryNum)
      retryNum++
      setMusicUrl(playMusicInfo.musicInfo, true)
      setAllStatus(t('player__refresh_url'))
      return
    }

    if (appSetting['player.autoSkipOnError']) {
      if (document.hidden) {
        console.warn('error skip to next')
        void playNext(true)
      } else {
        setAllStatus(t('player__error'))
        setTimeout(addDelayNextTimeout)
      }
    }
  }

  const handleSetPlayInfo = () => {
    retryNum = 0
    prevTimeoutId = null
    clearDelayNextTimeout()
    clearLoadingTimeout()
  }

  // const handlePlayedStop = () => {
  //   clearDelayNextTimeout()
  //   clearLoadingTimeout()
  // }


  window.app_event.on('playerLoadstart', handleLoadstart)
  window.app_event.on('playerLoadeddata', handleLoadeddata)
  window.app_event.on('playerPlaying', handlePlaying)
  window.app_event.on('playerWaiting', handleWating)
  window.app_event.on('playerEmptied', handleEmpied)
  window.app_event.on('playerError', handleError)
  window.app_event.on('musicToggled', handleSetPlayInfo)

  onBeforeUnmount(() => {
    window.app_event.off('playerLoadstart', handleLoadstart)
    window.app_event.off('playerLoadeddata', handleLoadeddata)
    window.app_event.off('playerPlaying', handlePlaying)
    window.app_event.off('playerWaiting', handleWating)
    window.app_event.off('playerEmptied', handleEmpied)
    window.app_event.off('playerError', handleError)
    window.app_event.off('musicToggled', handleSetPlayInfo)
  })
}
