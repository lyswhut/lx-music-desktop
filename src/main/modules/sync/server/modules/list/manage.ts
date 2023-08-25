import { type UserDataManage } from '../../user'
import { SnapshotDataManage } from './snapshotDataManage'
import { toMD5 } from '../../utils'
import { getLocalListData } from '@main/modules/sync/utils'

export class ListManage {
  snapshotDataManage: SnapshotDataManage

  constructor(userDataManage: UserDataManage) {
    this.snapshotDataManage = new SnapshotDataManage(userDataManage)
  }

  createSnapshot = async() => {
    const listData = JSON.stringify(await this.getListData())
    const md5 = toMD5(listData)
    const snapshotInfo = await this.snapshotDataManage.getSnapshotInfo()
    console.log(md5, snapshotInfo.latest)
    if (snapshotInfo.latest == md5) return md5
    if (snapshotInfo.list.includes(md5)) {
      snapshotInfo.list.splice(snapshotInfo.list.indexOf(md5), 1)
    } else await this.snapshotDataManage.saveSnapshot(md5, listData)
    if (snapshotInfo.latest) snapshotInfo.list.unshift(snapshotInfo.latest)
    snapshotInfo.latest = md5
    snapshotInfo.time = Date.now()
    this.snapshotDataManage.saveSnapshotInfo(snapshotInfo)
    return md5
  }

  getCurrentListInfoKey = async() => {
    const snapshotInfo = await this.snapshotDataManage.getSnapshotInfo()
    if (snapshotInfo.latest) {
      return snapshotInfo.latest
    }
    snapshotInfo.latest = toMD5(JSON.stringify(await this.getListData()))
    this.snapshotDataManage.saveSnapshotInfo(snapshotInfo)
    return snapshotInfo.latest
  }

  getDeviceCurrentSnapshotKey = async(clientId: string) => {
    return this.snapshotDataManage.getDeviceCurrentSnapshotKey(clientId)
  }

  updateDeviceSnapshotKey = async(clientId: string, key: string) => {
    await this.snapshotDataManage.updateDeviceSnapshotKey(clientId, key)
  }

  getListData = async(): Promise<LX.Sync.ListData> => {
    return getLocalListData()
  }
}

