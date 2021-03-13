const { mainSend, NAMES: { mainWindow: ipcMainWindowNames }, mainOn, mainHandle } = require('../../common/ipc')
const { mainWindow: MAIN_WINDOW_EVENT_NAME, hotKey: HOT_KEY_EVENT_NAME } = require('../events/_name')
const getStore = require('@common/store')


// const { registerHotkey, unRegisterHotkey } = require('../modules/hotKey/utils')

// mainHandle(ipcMainWindowNames.set_hot_key_config, async(event, { action, data }) => {
//   switch (action) {
//     case 'config':
//       global.lx_event.hotKey.saveConfig(data.data, MAIN_WINDOW_EVENT_NAME.source)
//       return
//     case 'register':
//       return registerHotkey(data)
//     case 'unregister':
//       return unRegisterHotkey(data)
//   }
// })

mainHandle(ipcMainWindowNames.get_hot_key, async() => {
  const electronStore_hotKey = getStore('hotKey')
  return {
    local: electronStore_hotKey.get('local'),
    global: electronStore_hotKey.get('global'),
  }
})

mainOn(ipcMainWindowNames.quit, () => global.lx_event.mainWindow.quit())
mainOn(ipcMainWindowNames.min_toggle, () => global.lx_event.mainWindow.toggleMinimize())
mainOn(ipcMainWindowNames.hide_toggle, () => global.lx_event.mainWindow.toggleHide())


global.lx_event.hotKey.on(HOT_KEY_EVENT_NAME.config, (config, source) => {
  if (!global.modules.mainWindow || source === MAIN_WINDOW_EVENT_NAME.name) return
  mainSend(global.modules.mainWindow, ipcMainWindowNames.set_hot_key_config, { config, source })
})

global.lx_event.hotKey.on(HOT_KEY_EVENT_NAME.keyDown, ({ type, key }) => {
  let info = global.appHotKey.config.global.keys[key]
  if (!info || info.type != MAIN_WINDOW_EVENT_NAME.name) return
  mainSend(global.modules.mainWindow, ipcMainWindowNames.key_down, { type, key })
})
