const Store = require('electron-store')
const { windowSizeList } = require('../../common/config')

exports.getWindowSizeInfo = ({ windowSizeId = 1 } = {}) => {
  return windowSizeList.find(i => i.id === windowSizeId) || windowSizeList[0]
}

exports.getAppSetting = () => {
  let electronStore = new Store()
  const defaultSetting = {
    windowSizeId: 1,
    tray: {
      isShow: false,
      isToTray: false,
    },
  }
  return Object.assign(defaultSetting, electronStore.get('setting') || {})
}

exports.parseEnv = () => {
  const params = {}
  const rx = /^-\w+/
  for (let param of process.argv) {
    if (!rx.test(param)) continue
    param = param.substring(1)
    let index = param.indexOf('=')
    if (index < 0) {
      params[param] = true
    } else {
      params[param.substring(0, index)] = param.substring(index + 1)
    }
  }
  return params
}

