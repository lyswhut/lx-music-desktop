const Store = require('electron-store')
const { dialog, app, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const log = require('electron-log')

const stores = {}

/**
 * 获取 Store 对象
 * @param {*} name store 名
 * @param {*} isIgnoredError 是否忽略错误
 * @param {*} isShowErrorAlert 是否显示错误弹窗
 * @returns Store
 */
module.exports = (name, isIgnoredError = true, isShowErrorAlert = true) => {
  if (stores[name]) return stores[name]
  let store
  try {
    store = stores[name] = new Store({ name, clearInvalidConfig: false })
  } catch (error) {
    log.error(error)

    if (!isIgnoredError) throw error


    const backPath = path.join(app.getPath('userData'), name + '.json.bak')
    fs.copyFileSync(path.join(app.getPath('userData'), name + '.json'), backPath)
    if (isShowErrorAlert) {
      dialog.showMessageBoxSync({
        type: 'error',
        message: name + ' data load error',
        detail: `We have helped you back up the old ${name} file to: ${backPath}\nYou can try to repair and restore it manually\n\nError detail: ${error.message}`,
      })
      shell.showItemInFolder(backPath)
    }


    store = new Store({ name, clearInvalidConfig: true })
  }
  return store
}
