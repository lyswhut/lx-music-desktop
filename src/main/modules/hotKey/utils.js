const { globalShortcut } = require('electron')
const { log } = require('../../../common/utils')

const handleKeyDown = key => {
  if (!global.appHotKey.enable) return
  global.lx_event.hotKey.keyDown({ type: 'global', key })
}

const transformedKeyRxp = /(^|\+)[a-z]/g

const transformedKey = key => {
  if (key.includes('arrow')) key = key.replace(/arrow/g, '')
  return key.replace('mod', 'CommandOrControl').replace(transformedKeyRxp, l => l.toUpperCase())
}
exports.registerHotkey = ({ key, info }) => {
  if (global.appHotKey.state[key] && global.appHotKey.state[key].status) return true
  let transKey = transformedKey(key)
  // console.log('Register key:', transKey)
  if (!global.appHotKey.state[key]) {
    global.appHotKey.state[key] = {
      status: false,
      info: null,
    }
  }
  global.appHotKey.state[key].info = info
  let status = global.appHotKey.state[key].status = globalShortcut.isRegistered(transKey)
    ? false
    : globalShortcut.register(transKey, () => {
      handleKeyDown(key)
    })
  return status
}

exports.unRegisterHotkey = key => {
  let transKey = transformedKey(key)
  // console.log('Unregister key:', transKey)
  globalShortcut.unregister(transKey)
  delete global.appHotKey.state[key]
}

exports.unRegisterHotkeyAll = () => {
  global.appHotKey.state = {}
  globalShortcut.unregisterAll()
}

exports.handleKeyDown = handleKeyDown
exports.transformedKey = transformedKey

const handleRegisterHotkey = data => {
  let ret = exports.registerHotkey(data)
  if (!ret) log.info('Register hot key failed:', data.key)
}


exports.init = (isForce = false) => {
  exports.unRegisterHotkeyAll()
  if (!isForce && !global.appHotKey.config.global.enable) return
  global.appHotKey.state = {}
  // console.log(global.appHotKey.config.global.keys)
  for (const key of Object.keys(global.appHotKey.config.global.keys)) {
    try {
      handleRegisterHotkey({ key, info: global.appHotKey.config.global.keys[key] })
    } catch (err) {
      log.info(err)
    }
  }
}
