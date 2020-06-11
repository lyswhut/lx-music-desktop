const Store = require('electron-store')
const { windowSizeList } = require('../../common/config')
const { objectDeepMerge } = require('../../common/utils')

exports.getWindowSizeInfo = ({ windowSizeId = 1 } = {}) => {
  return windowSizeList.find(i => i.id === windowSizeId) || windowSizeList[0]
}

exports.getAppSetting = () => {
  const electronStore_config = new Store({
    name: 'config',
  })
  return electronStore_config.get('setting')
}


exports.updateSetting = settings => {
  objectDeepMerge(global.appSetting, settings)
}
