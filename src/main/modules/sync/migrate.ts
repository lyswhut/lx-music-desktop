import { File } from '../../../common/constants_sync'
import fs from 'node:fs'
import path from 'node:path'
import { exists } from './utils'

interface ServerKeyInfo {
  clientId: string
  key: string
  deviceName: string
  lastSyncDate?: number
  snapshotKey?: string
  lastConnectDate?: number
  isMobile: boolean
}


// 迁移 v2 sync 数据
export default async(dataPath: string) => {
  const syncDataPath = path.join(dataPath, 'sync')
  // console.log(syncDataPath)
  if (await exists(syncDataPath)) return
  const oldInfoPath = path.join(dataPath, 'sync.json')
  // console.log(oldInfoPath)
  if (!await exists(oldInfoPath)) return
  const serverSyncDataPath = path.join(dataPath, File.serverDataPath)
  const clientSyncDataPath = path.join(dataPath, File.clientDataPath)

  await fs.promises.mkdir(serverSyncDataPath, { recursive: true })
  await fs.promises.mkdir(clientSyncDataPath, { recursive: true })
  const info = JSON.parse((await fs.promises.readFile(oldInfoPath)).toString())


  const serverInfoPath = path.join(serverSyncDataPath, File.serverInfoJSON)
  const devicesInfoPath = path.join(serverSyncDataPath, File.userDevicesJSON)
  const listDir = path.join(serverSyncDataPath, File.listDir)
  await fs.promises.mkdir(listDir)


  const snapshotInfo = info.snapshotInfo
  delete info.snapshotInfo
  snapshotInfo.clients = {}
  for (const device of Object.values<ServerKeyInfo>(info.clients)) {
    snapshotInfo.clients[device.clientId] = {
      snapshotKey: device.snapshotKey,
      lastSyncDate: device.lastSyncDate,
    }
    device.lastConnectDate = device.lastSyncDate
    delete device.lastSyncDate
    delete device.snapshotKey
  }
  const devicesInfo = {
    userName: 'default',
    clients: info.clients,
  }
  await fs.promises.writeFile(serverInfoPath, JSON.stringify({ serverId: info.serverId, version: 2 }))
  await fs.promises.writeFile(devicesInfoPath, JSON.stringify(devicesInfo))
  await fs.promises.writeFile(path.join(listDir, File.listSnapshotInfoJSON), JSON.stringify(snapshotInfo))

  const snapshotPath = path.join(listDir, File.listSnapshotDir)
  await fs.promises.mkdir(snapshotPath)
  const snapshots = (await fs.promises.readdir(dataPath)).filter(name => name.startsWith('snapshot_'))
  if (snapshots.length) {
    for (const file of snapshots) {
      await fs.promises.copyFile(path.join(dataPath, file), path.join(snapshotPath, file))
    }
  }


  await fs.promises.writeFile(path.join(clientSyncDataPath, File.syncAuthKeysJSON), JSON.stringify(info.syncAuthKey))

  for (const file of snapshots) {
    await fs.promises.unlink(path.join(dataPath, file))
  }
  await fs.promises.unlink(oldInfoPath)
}

