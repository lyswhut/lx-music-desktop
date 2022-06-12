import { openUrl, getFontSizeWithScreen } from '@renderer/utils'
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

const handle_key_down = ({ event, type, key }) => {
  // console.log(key)
  if (key != 'escape' || !event || event.repeat || type == 'up' || window.isEditingHotKey) return
  if (event.target.tagName != 'INPUT' || event.target.classList.contains('ignore-esc')) {
    if (isFullscreen.value) {
      event.lx_handled = true
      rendererInvoke(NAMES.mainWindow.fullscreen, false).then(fullscreen => {
        isFullscreen.value = fullscreen
      })
    }
    return
  }
  event.target.value = ''
  event.target.blur()
  event.lx_handled = true
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
  let fullscreen = !isFullscreen.value
  if (typeof event == 'boolean') {
    fullscreen = event
  } else if (event.event.repeat) return
  rendererInvoke(NAMES.mainWindow.fullscreen, fullscreen).then(fullscreen => {
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
  const theme = useRefGetter('theme')
  const font = useRefGetter('font')
  const windowSizeActive = useRefGetter('windowSizeActive')
  const setSetting = useCommit('setSetting')
  const isShowAnimation = useRefGetter('isShowAnimation')

  const dom_root = document.getElementById('root')


  watch(theme, (val) => {
    dom_root.className = val
  })
  watch(font, (val) => {
    document.documentElement.style.fontFamily = val
  }, {
    immediate: true,
  })
  watch(isFullscreen, val => {
    if (val) {
      document.body.classList.remove(window.dt ? 'disableTransparent' : 'transparent')
      document.body.classList.add('fullscreen')
      document.documentElement.style.fontSize = getFontSizeWithScreen(window.screen.width) + 'px'
    } else {
      document.body.classList.remove('fullscreen')
      document.body.classList.add(window.dt ? 'disableTransparent' : 'transparent')
      document.documentElement.style.fontSize = windowSizeActive.value.fontSize
    }
  }, {
    immediate: true,
  })

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
  }, {
    immediate: true,
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
  window.eventHub.on(eventBaseName.key_down, handle_key_down)
  window.eventHub.on('key_mod+f12_down', handle_open_devtools)
  window.eventHub.on('key_f11_down', handle_fullscreen)
  window.eventHub.on(eventBaseName.fullscreenToggle, handle_fullscreen)
  document.body.addEventListener('click', handleBodyClick, true)

  if (isProd && !window.dt && !isLinux) {
    document.body.addEventListener('mouseenter', enableIgnoreMouseEvents)
    document.body.addEventListener('mouseleave', dieableIgnoreMouseEvents)
    const dom_root = document.getElementById('root')
    dom_root.addEventListener('mouseenter', dieableIgnoreMouseEvents)
    dom_root.addEventListener('mouseleave', enableIgnoreMouseEvents)
  }

  onBeforeUnmount(() => {
    window.eventHub.off(eventBaseName.key_down, handle_key_down)
    window.eventHub.off('key_mod+f12_down', handle_open_devtools)
    window.eventHub.off('key_f11_down', handle_fullscreen)
    window.eventHub.off(eventBaseName.fullscreenToggle, handle_fullscreen)
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
