import { randomBytes } from 'node:crypto'
import { STORE_NAMES } from '@common/constants'
import getStore from '@main/utils/store'
import { throttle } from '@common/utils/common'
import path from 'node:path'
import fs from 'node:fs'
import log from './log'


export const getSyncAuthKey = async(serverId: string) => {
  const store = getStore(STORE_NAMES.SYNC)
  const keys = store.get('syncAuthKey') as Record<string, LX.Sync.ClientKeyInfo> | null
  if (!keys) return null
  return keys[serverId] ?? null
}
export const setSyncAuthKey = async(serverId: string, info: LX.Sync.ClientKeyInfo) => {
  const store = getStore(STORE_NAMES.SYNC)
  let keys: Record<string, LX.Sync.ClientKeyInfo> = (store.get('syncAuthKey') as Record<string, LX.Sync.ClientKeyInfo> | null) ?? {}
  keys[serverId] = info
  store.set('syncAuthKey', keys)
}

let syncHost: string
export const getSyncHost = async() => {
  if (syncHost === undefined) {
    const store = getStore(STORE_NAMES.SYNC)
    syncHost = (store.get('syncHost') as typeof syncHost | null) ?? ''
  }
  return syncHost
}
export const setSyncHost = async(host: string) => {
  // let hostInfo = await getData(syncHostPrefix) || {}
  // hostInfo.host = host
  // hostInfo.port = port
  syncHost = host
  const store = getStore(STORE_NAMES.SYNC)
  store.set('syncHost', syncHost)
}
let syncHostHistory: string[]
export const getSyncHostHistory = async() => {
  if (syncHostHistory === undefined) {
    const store = getStore(STORE_NAMES.SYNC)
    syncHostHistory = (store.get('syncHostHistory') as string[]) ?? []
  }
  return syncHostHistory
}
export const addSyncHostHistory = async(host: string) => {
  let syncHostHistory = await getSyncHostHistory()
  if (syncHostHistory.some(h => h == host)) return
  syncHostHistory.unshift(host)
  if (syncHostHistory.length > 20) syncHostHistory = syncHostHistory.slice(0, 20) // 最多存储20个
  const store = getStore(STORE_NAMES.SYNC)
  store.set('syncHostHistory', syncHostHistory)
}
export const removeSyncHostHistory = async(index: number) => {
  syncHostHistory.splice(index, 1)
  const store = getStore(STORE_NAMES.SYNC)
  store.set('syncHostHistory', syncHostHistory)
}

export interface SnapshotInfo {
  latest: string | null
  time: number
  list: string[]
}
interface DevicesInfo {
  serverId: string
  clients: Record<string, LX.Sync.ServerKeyInfo>
  snapshotInfo: SnapshotInfo
}
// const devicesFilePath = path.join(global.lx.dataPath, 'devices.json')
const devicesInfo: DevicesInfo = { serverId: '', clients: {}, snapshotInfo: { latest: null, time: 0, list: [] } }
let deviceKeys: string[] = []
const saveDevicesInfoThrottle = throttle(() => {
  const store = getStore(STORE_NAMES.SYNC)
  store.set('clients', devicesInfo.clients)
})

const initDeviceInfo = () => {
  const store = getStore(STORE_NAMES.SYNC)
  const serverId = store.get('serverId') as string | undefined
  if (serverId) devicesInfo.serverId = serverId
  else {
    devicesInfo.serverId = randomBytes(4 * 4).toString('base64')
    const store = getStore(STORE_NAMES.SYNC)
    store.set('serverId', devicesInfo.serverId)
  }
  const devices = store.get('clients') as DevicesInfo['clients'] | undefined
  if (devices) devicesInfo.clients = devices
  deviceKeys = Object.values(devicesInfo.clients).map(device => device.snapshotKey).filter(k => k)
  const snapshotInfo = store.get('snapshotInfo') as DevicesInfo['snapshotInfo'] | undefined
  if (snapshotInfo) devicesInfo.snapshotInfo = snapshotInfo
}

export const createClientKeyInfo = (deviceName: string, isMobile: boolean): LX.Sync.ServerKeyInfo => {
  const keyInfo: LX.Sync.ServerKeyInfo = {
    clientId: randomBytes(4 * 4).toString('base64'),
    key: randomBytes(16).toString('base64'),
    deviceName,
    isMobile,
    snapshotKey: '',
    lastSyncDate: 0,
  }
  saveClientKeyInfo(keyInfo)
  return keyInfo
}
export const saveClientKeyInfo = (keyInfo: LX.Sync.ServerKeyInfo) => {
  if (devicesInfo.clients[keyInfo.clientId] == null && Object.keys(devicesInfo.clients).length > 101) throw new Error('max keys')
  devicesInfo.clients[keyInfo.clientId] = keyInfo
  saveDevicesInfoThrottle()
}
export const getClientKeyInfo = (clientId?: string): LX.Sync.ServerKeyInfo | null => {
  if (!clientId) return null
  if (!devicesInfo.serverId) initDeviceInfo()
  return devicesInfo.clients[clientId] ?? null
}
export const getServerId = (): string => {
  if (!devicesInfo.serverId) initDeviceInfo()
  return devicesInfo.serverId
}
export const isIncluedsDevice = (name: string) => {
  return deviceKeys.includes(name)
}
export const clearOldSnapshot = async() => {
  if (!devicesInfo.snapshotInfo) return
  const snapshotList = devicesInfo.snapshotInfo.list.filter(name => !isIncluedsDevice(name))
  let requiredSave = snapshotList.length > global.lx.appSetting['sync.server.maxSsnapshotNum']
  while (snapshotList.length > global.lx.appSetting['sync.server.maxSsnapshotNum']) {
    const name = snapshotList.pop()
    if (name) {
      await removeSnapshot(name)
      devicesInfo.snapshotInfo.list.splice(devicesInfo.snapshotInfo.list.indexOf(name), 1)
    } else break
  }
  if (requiredSave) saveSnapshotInfo(devicesInfo.snapshotInfo)
}
export const updateDeviceSnapshotKey = (keyInfo: LX.Sync.ServerKeyInfo, key: string) => {
  if (keyInfo.snapshotKey) deviceKeys.splice(deviceKeys.indexOf(keyInfo.snapshotKey), 1)
  keyInfo.snapshotKey = key
  keyInfo.lastSyncDate = Date.now()
  saveClientKeyInfo(keyInfo)
  deviceKeys.push(key)
  saveDevicesInfoThrottle()
  void clearOldSnapshot()
}

const saveSnapshotInfoThrottle = throttle(() => {
  const store = getStore(STORE_NAMES.SYNC)
  store.set('snapshotInfo', devicesInfo.snapshotInfo)
})
export const getSnapshotInfo = (): SnapshotInfo => {
  return devicesInfo.snapshotInfo
}
export const saveSnapshotInfo = (info: SnapshotInfo) => {
  devicesInfo.snapshotInfo = info
  saveSnapshotInfoThrottle()
}

export const getSnapshot = async(name: string) => {
  console.log('getSnapshot', name)
  const filePath = path.join(global.lxDataPath, `snapshot_${name}`)
  let listData: LX.Sync.ListData
  try {
    listData = JSON.parse((await fs.promises.readFile(filePath)).toString('utf-8'))
  } catch (err) {
    log.warn(err)
    return null
  }
  return listData
}
export const saveSnapshot = async(name: string, data: string) => {
  console.log('saveSnapshot', name)
  const filePath = path.join(global.lxDataPath, `snapshot_${name}`)
  return fs.promises.writeFile(filePath, data).catch((err) => {
    log.error(err)
    throw err
  })
}
export const removeSnapshot = async(name: string) => {
  console.log('removeSnapshot', name)
  const filePath = path.join(global.lxDataPath, `snapshot_${name}`)
  return fs.promises.unlink(filePath).catch((err) => {
    log.error(err)
  })
}
