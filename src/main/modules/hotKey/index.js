const { app } = require('electron')
const { init, unRegisterHotkeyAll } = require('./utils')
const { hotKey: HOT_KEY_EVENT_NAME } = require('../../events/_name')

global.appHotKey.state = {}

app.on('will-quit', unRegisterHotkeyAll)

global.lx_event.hotKey.on(HOT_KEY_EVENT_NAME.init, init)


require('./rendererEvent')
