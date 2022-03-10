import { openUrl } from '@renderer/utils'
import { base as eventBaseName } from '@renderer/event/names'
import { onSetConfig, onSystemThemeChange } from '@renderer/utils/tools'
import { isFullscreen, themeShouldUseDarkColors } from '@renderer/core/share'
import { rendererSend, NAMES, rendererInvoke } from '@common/ipc'

import {
  toRaw,
  useCommit,
  onBeforeUnmount,
  watch,
  useRefGetter,
} from '@renderer/utils/vueTools'

const handle_key_esc_down = ({ event }) => {
  if (event.repeat) return
  if (event.target.tagName != 'INPUT' || event.target.classList.contains('ignore-esc')) return
  event.target.value = ''
  event.target.blur()
}
const handleBodyClick = event => {
  if (event.target.tagName != 'A') return
  if (event.target.host == window.location.host) return
  event.preventDefault()
  if (/^https?:\/\//.test(event.target.href)) openUrl(event.target.href)
}
const handle_open_devtools = event => {
  rendererSend(NAMES.mainWindow.open_dev_tools)
}
const handle_fullscreen = event => {
  if (event.event.repeat) return
  rendererInvoke(NAMES.mainWindow.fullscreen, !isFullscreen.value).then(fullscreen => {
    isFullscreen.value = fullscreen
  })
}

export default ({
  dieableIgnoreMouseEvents,
  enableIgnoreMouseEvents,
  setting,
  isProd,
  isLinux,
}) => {
  const setSetting = useCommit('setSetting')
  const windowSizeActive = useRefGetter('windowSizeActive')
  const isShowAnimation = useRefGetter('isShowAnimation')

  watch(windowSizeActive, ({ fontSize }) => {
    document.documentElement.style.fontSize = fontSize
  })
  watch(isShowAnimation, val => {
    if (val) {
      if (document.body.classList.contains('disableAnimation')) {
        document.body.classList.remove('disableAnimation')
      }
    } else {
      if (!document.body.classList.contains('disableAnimation')) {
        document.body.classList.add('disableAnimation')
      }
    }
  })

  const rSetConfig = onSetConfig((event, config) => {
    // console.log(config)
    setSetting(Object.assign({}, toRaw(setting.value), config))
    window.eventHub.emit(eventBaseName.set_config, config)
  })

  const rSystemThemeChange = onSystemThemeChange((event, isDark) => {
    // console.log(isDark)
    themeShouldUseDarkColors.value = isDark
  })

  window.eventHub.emit(eventBaseName.bindKey)
  window.eventHub.on('key_escape_down', handle_key_esc_down)
  window.eventHub.on('key_mod+f12_down', handle_open_devtools)
  window.eventHub.on('key_f11_down', handle_fullscreen)
  document.body.addEventListener('click', handleBodyClick, true)

  if (isProd && !window.dt && !isLinux) {
    document.body.addEventListener('mouseenter', enableIgnoreMouseEvents)
    document.body.addEventListener('mouseleave', dieableIgnoreMouseEvents)
    const dom_root = document.getElementById('root')
    dom_root.addEventListener('mouseenter', dieableIgnoreMouseEvents)
    dom_root.addEventListener('mouseleave', enableIgnoreMouseEvents)
  }

  onBeforeUnmount(() => {
    window.eventHub.off('key_escape_down', handle_key_esc_down)
    window.eventHub.off('key_mod+f12_down', handle_open_devtools)
    window.eventHub.off('key_f11_down', handle_fullscreen)
    document.body.removeEventListener('click', handleBodyClick)
    window.eventHub.emit(eventBaseName.unbindKey)
    rSetConfig()
    rSystemThemeChange()

    if (isProd && !window.dt && !isLinux) {
      document.body.removeEventListener('mouseenter', enableIgnoreMouseEvents)
      document.body.removeEventListener('mouseleave', dieableIgnoreMouseEvents)
      const dom_root = document.getElementById('root')
      dom_root.removeEventListener('mouseenter', dieableIgnoreMouseEvents)
      dom_root.removeEventListener('mouseleave', enableIgnoreMouseEvents)
    }
  })
}
