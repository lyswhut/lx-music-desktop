import Store from 'electron-store'
import { dialog, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { log } from '@common/utils'

type Stores = Record<string, Store>

const stores: Stores = {}

/**
 * 获取 Store 对象
 * @param  {string} name store 名
 * @param  {boolean|undefined} isIgnoredError 是否忽略错误
 * @param  {boolean|undefined} isShowErrorAlert=true 是否显示错误弹窗
 * @returns Store
 */
export default (name: string, isIgnoredError = true, isShowErrorAlert = true): Store => {
  if (stores[name]) return stores[name]
  let store: Store
  try {
    store = stores[name] = new Store({ name, clearInvalidConfig: false, cwd: global.lxDataPath })
  } catch (err: any) {
    const error = err as Error
    log.error(error)

    if (!isIgnoredError) throw error


    const backPath = path.join(global.lxDataPath, name + '.json.bak')
    fs.renameSync(path.join(global.lxDataPath, name + '.json'), backPath)
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

export {
  Store,
}
