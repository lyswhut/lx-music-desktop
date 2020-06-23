const Store = require('electron-store')
const { windowSizeList } = require('../../common/config')
const { objectDeepMerge, throttle } = require('../../common/utils')

exports.getWindowSizeInfo = ({ windowSizeId = 1 } = {}) => {
  return windowSizeList.find(i => i.id === windowSizeId) || windowSizeList[0]
}

const electronStore_config = new Store({
  name: 'config',
})
exports.getAppSetting = () => {
  return electronStore_config.get('setting')
}

const electronStore_hotKey = new Store({
  name: 'hotKey',
})
exports.getAppHotKeyConfig = () => {
  return {
    global: electronStore_hotKey.get('global'),
    local: electronStore_hotKey.get('local'),
  }
}
const saveHotKeyConfig = throttle(config => {
  for (const key of Object.keys(config)) {
    global.appHotKey.config[key] = config[key]
    electronStore_hotKey.set(key, config[key])
  }
})
exports.saveAppHotKeyConfig = config => {
  saveHotKeyConfig(config)
}

const saveSetting = throttle(n => {
  electronStore_config.set('setting', n)
})
exports.updateSetting = settings => {
  objectDeepMerge(global.appSetting, settings)
  saveSetting(global.appSetting)
}
