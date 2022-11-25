import { getHotKeyConfig, onFocus, onKeyDown, onUpdateHotkey } from '@renderer/utils/ipc'
import { registerKeyEvent, createKeyEventHub } from './keyEvent'
// import { registerRendererEvents, unregisterRendererEvents } from './rendererEvent'
import { createAppEventHub } from './appEvent'

export const registerEvents = () => {
  window.lx.isEditingHotKey = false
  window.app_event = createAppEventHub()
  window.key_event = createKeyEventHub()

  const setHotkeyConfig = ({ local, global }: LX.HotKeyConfigAll) => {
    window.lx.appHotKeyConfig = {
      local,
      global,
    }
  }

  void getHotKeyConfig().then(setHotkeyConfig)

  onUpdateHotkey(({ params }) => {
    setHotkeyConfig(params)
  })

  onKeyDown(({ params: { key } }) => {
    const keyInfo = window.lx.appHotKeyConfig.global.keys[key]
    if (keyInfo) window.key_event.emit(keyInfo.action)
  })

  onFocus(() => {
    window.app_event.focus()
  })

  registerKeyEvent()
  // registerRendererEvents()
}

// export const unregisterEvents = () => {
//   unregisterKeyEvent()
//   // unregisterRendererEvents()
// }

export { clearDownKeys } from './keyEvent'

export type { AppEventTypes } from './appEvent'
export type { KeyEventTypes } from './keyEvent'

registerEvents()
