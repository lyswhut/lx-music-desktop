// import { writeFileSync } from 'atomically'
import { dialog, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { log } from '@common/utils'

type Stores = Record<string, Store>

const stores: Stores = {}


class Store {
  private readonly filePath: string
  private readonly dirPath: string
  private store: Record<string, any>

  private writeFile() {
    const tempPath = this.filePath + '.' + Math.random().toString().substring(2, 10) + '.temp'
    try {
      fs.writeFileSync(tempPath, JSON.stringify(this.store, null, '\t'), 'utf8')
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        fs.mkdirSync(this.dirPath, { recursive: true })
        fs.writeFileSync(tempPath, JSON.stringify(this.store, null, '\t'), 'utf8')
      } else throw err
    }
    fs.renameSync(tempPath, this.filePath)
  }

  constructor(filePath: string, clearInvalidConfig: boolean = false) {
    this.filePath = filePath
    this.dirPath = path.dirname(this.filePath)

    let store: Record<string, any>
    if (fs.existsSync(this.filePath)) {
      if (clearInvalidConfig) {
        try {
          store = JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
        } catch {
          store = {}
        }
      } else store = JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
    } else store = {}

    if (typeof store != 'object') {
      if (clearInvalidConfig) store = {}
      else throw new Error('parse data error: ' + String(store))
    }
    this.store = store
  }

  get<Value>(key: string): Value {
    return this.store[key]
  }

  has(key: string): boolean {
    return key in this.store
  }

  set(key: string, value: any) {
    this.store[key] = value
    this.writeFile()
  }

  override(value: Record<string, any>) {
    this.store = value
    this.writeFile()
  }
}

/**
 * 获取 Store 对象
 * @param name store 名
 * @param isIgnoredError 是否忽略错误
 * @param isShowErrorAlert=true 是否显示错误弹窗
 * @returns Store
 */
export default (name: string, isIgnoredError = true, isShowErrorAlert = true): Store => {
  if (stores[name]) return stores[name]
  let store: Store
  const storePath = path.join(global.lxDataPath, name + '.json')
  try {
    store = stores[name] = new Store(storePath, false)
  } catch (err: any) {
    const error = err as Error
    log.error(error)

    if (!isIgnoredError) throw error


    const backPath = storePath + '.bak'
    fs.renameSync(storePath, backPath)
    if (isShowErrorAlert) {
      dialog.showMessageBoxSync({
        type: 'error',
        message: name + ' data load error',
        detail: `We have helped you back up the old ${name} file to: ${backPath}\nYou can try to repair and restore it manually\n\nError detail: ${error.message}`,
      })
      shell.showItemInFolder(backPath)
    }


    store = new Store(storePath, true)
  }
  return store
}

export {
  Store,
}
