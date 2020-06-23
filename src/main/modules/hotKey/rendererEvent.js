const {
  mainHandle,
  NAMES: {
    hotKey: ipcHotKeyNames,
  },
} = require('../../../common/ipc')
const { init, registerHotkey, unRegisterHotkey, unRegisterHotkeyAll } = require('./utils')

mainHandle(ipcHotKeyNames.set_config, async(event, { action, data, source }) => {
  switch (action) {
    case 'config':
      global.lx_event.hotKey.saveConfig(data, source)
      return true
    case 'enable':
      data ? init(true) : unRegisterHotkeyAll()
      return true
    case 'register':
      return registerHotkey(data)
    case 'unregister':
      return unRegisterHotkey(data)
  }
})

mainHandle(ipcHotKeyNames.status, async() => global.appHotKey.state)

mainHandle(ipcHotKeyNames.enable, async(event, flag) => {
  flag ? init() : unRegisterHotkeyAll()
})
