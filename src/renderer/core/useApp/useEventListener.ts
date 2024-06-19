import { getFontSizeWithScreen } from '@renderer/utils'
import {
  minWindow,
  onFocus,
  onSettingChanged,
  onThemeChange,
  openDevTools,
  quitApp,
  setFullScreen,
  showHideWindowToggle,
} from '@renderer/utils/ipc'
import {
  isFullscreen,
  themeId,
  themeShouldUseDarkColors,
} from '@renderer/store'
import {
  appSetting,
  isShowAnimation,
  mergeSetting,
} from '@renderer/store/setting'

import {
  onBeforeUnmount,
  watch,
} from '@common/utils/vueTools'
// import { isLinux, isProd } from '@common/utils'
import { openUrl } from '@common/utils/electron'
import { HOTKEY_COMMON } from '@common/hotKey'
import { applyTheme, getThemes } from '@renderer/store/utils'
import { clearDownKeys } from '@renderer/event'

const handle_key_down = ({ event, type, key }: LX.KeyDownEevent) => {
  // console.log(key)
  if (key != 'escape' || !event || event.repeat || type == 'up' || window.lx.isEditingHotKey || (event.target as HTMLElement)?.classList.contains('ignore-esc') || event.lx_handled) return
  if ((event.target as HTMLElement).tagName != 'INPUT') {
    if (isFullscreen.value) {
      event.lx_handled = true
      void setFullScreen(false).then(fullscreen => {
        isFullscreen.value = fullscreen
      })
    }
    return
  }
  (event.target as HTMLInputElement).value = ''
  ;(event.target as HTMLInputElement).blur()
  event.lx_handled = true
}

const handleBodyClick = (event: MouseEvent) => {
  if ((event?.target as HTMLElement)?.tagName != 'A') return
  if ((event?.target as HTMLAnchorElement).host == window.location.host) return
  event.preventDefault()
  if (/^https?:\/\//.test((event?.target as HTMLAnchorElement).href)) void openUrl((event?.target as HTMLAnchorElement).href)
}
const handle_open_devtools = () => {
  openDevTools()
}
const handle_fullscreen = (event: LX.KeyDownEevent) => {
  let fullscreen = !isFullscreen.value
  if (typeof event == 'boolean') {
    fullscreen = event
  } else if (event.event?.repeat) return
  void setFullScreen(fullscreen).then(fullscreen => {
    isFullscreen.value = fullscreen
  })
}
const handle_selection = (event: LX.KeyDownEevent) => {
  event.event?.preventDefault()
}

export default () => {
  watch(isFullscreen, val => {
    if (val) {
      document.documentElement.classList.remove(window.dt ? 'disableTransparent' : 'transparent')
      document.documentElement.classList.add('fullscreen')
      document.documentElement.style.fontSize = `${getFontSizeWithScreen(window.screen.width)}px`
    } else {
      document.documentElement.classList.remove('fullscreen')
      document.documentElement.classList.add(window.dt ? 'disableTransparent' : 'transparent')
      document.documentElement.style.fontSize = `${appSetting['common.fontSize']}px`
    }
  }, {
    immediate: true,
  })

  watch(isShowAnimation, val => {
    if (val) {
      if (document.documentElement.classList.contains('disableAnimation')) {
        document.documentElement.classList.remove('disableAnimation')
      }
    } else {
      if (!document.documentElement.classList.contains('disableAnimation')) {
        document.documentElement.classList.add('disableAnimation')
      }
    }
  }, {
    immediate: true,
  })

  const rSetConfig = onSettingChanged(({ params: setting }) => {
    // console.log(config)
    mergeSetting(setting)
    window.app_event.configUpdate(setting)
  })

  const rFocus = onFocus(() => {
    clearDownKeys()
  })

  const rThemeChange = onThemeChange(({ params: setting }) => {
    // console.log(setting)
    if (themeShouldUseDarkColors.value == setting.shouldUseDarkColors) {
      if (themeId.value == setting.theme.id) return
      themeId.value = setting.theme.id
    } else {
      themeShouldUseDarkColors.value = setting.shouldUseDarkColors
      if (themeId.value != 'auto') return
    }
    getThemes(({ dataPath }) => {
      applyTheme('auto', appSetting['theme.lightId'], appSetting['theme.darkId'], dataPath)
    })
  })

  window.key_event.on(HOTKEY_COMMON.min.action, minWindow)
  window.key_event.on(HOTKEY_COMMON.hide_toggle.action, showHideWindowToggle)
  window.key_event.on(HOTKEY_COMMON.close.action, quitApp)

  window.app_event.on('keyDown', handle_key_down)
  window.key_event.on('key_mod+f12_down', handle_open_devtools)
  window.key_event.on('key_f11_down', handle_fullscreen)
  window.key_event.on('key_mod+a_down', handle_selection)
  document.body.addEventListener('click', handleBodyClick, true)

  onBeforeUnmount(() => {
    window.key_event.off(HOTKEY_COMMON.min.action, minWindow)
    window.key_event.off(HOTKEY_COMMON.hide_toggle.action, showHideWindowToggle)
    window.key_event.off(HOTKEY_COMMON.close.action, quitApp)

    window.app_event.off('keyDown', handle_key_down)
    window.key_event.off('key_mod+f12_down', handle_open_devtools)
    window.key_event.off('key_f11_down', handle_fullscreen)
    window.key_event.off('key_mod+a_down', handle_selection)
    document.body.removeEventListener('click', handleBodyClick)
    rSetConfig()
    rFocus()
    rThemeChange()
  })
}
