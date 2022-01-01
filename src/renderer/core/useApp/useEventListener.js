import { openUrl } from '@renderer/utils'
import { base as eventBaseName } from '@renderer/event/names'
import { onSetConfig } from '@renderer/utils/tools'

import {
  toRaw,
  useCommit,
  onBeforeUnmount,
  watchEffect,
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

export default ({
  dieableIgnoreMouseEvents,
  enableIgnoreMouseEvents,
  setting,
  isProd,
  isLinux,
}) => {
  const setSetting = useCommit('setSetting')
  const windowSizeActive = useRefGetter('windowSizeActive')

  watchEffect(() => {
    document.documentElement.style.fontSize = windowSizeActive.value.fontSize
  })
  watchEffect(() => {
    if (setting.value.isShowAnimation) {
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

  window.eventHub.emit(eventBaseName.bindKey)
  window.eventHub.on('key_escape_down', handle_key_esc_down)
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
    document.body.removeEventListener('click', handleBodyClick)
    window.eventHub.emit(eventBaseName.unbindKey)
    rSetConfig()

    if (isProd && !window.dt && !isLinux) {
      document.body.removeEventListener('mouseenter', enableIgnoreMouseEvents)
      document.body.removeEventListener('mouseleave', dieableIgnoreMouseEvents)
      const dom_root = document.getElementById('root')
      dom_root.removeEventListener('mouseenter', dieableIgnoreMouseEvents)
      dom_root.removeEventListener('mouseleave', enableIgnoreMouseEvents)
    }
  })
}
