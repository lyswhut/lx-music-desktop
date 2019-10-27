const Store = require('electron-store')
const { windowSizeList } = require('../../common/config')

exports.getWindowSizeInfo = () => {
  let electronStore = new Store()
  const { windowSizeId = 1 } = electronStore.get('setting') || {}
  return windowSizeList.find(i => i.id === windowSizeId) || windowSizeList[0]
}
