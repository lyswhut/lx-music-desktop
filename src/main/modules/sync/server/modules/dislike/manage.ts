import { type UserDataManage } from '../../user'
import { SnapshotDataManage } from './snapshotDataManage'
import { toMD5 } from '../../utils'
import { getLocalDislikeData } from '@main/modules/sync/dislikeEvent'

export class DislikeManage {
  snapshotDataManage: SnapshotDataManage

  constructor(userDataManage: UserDataManage) {
    this.snapshotDataManage = new SnapshotDataManage(userDataManage)
  }

  createSnapshot = async() => {
    const listData = await this.getDislikeRules()
    const md5 = toMD5(listData.trim())
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
    // const snapshotInfo = await this.snapshotDataManage.getSnapshotInfo()
    // if (snapshotInfo.latest) {
    //   return snapshotInfo.latest
    // }
    // snapshotInfo.latest = toMD5((await this.getDislikeRules()).trim())
    // this.snapshotDataManage.saveSnapshotInfo(snapshotInfo)
    // return snapshotInfo.latest
    return this.createSnapshot()
  }

  getDeviceCurrentSnapshotKey = async(clientId: string) => {
    return this.snapshotDataManage.getDeviceCurrentSnapshotKey(clientId)
  }

  updateDeviceSnapshotKey = async(clientId: string, key: string) => {
    await this.snapshotDataManage.updateDeviceSnapshotKey(clientId, key)
  }

  removeDevice = async(clientId: string) => {
    this.snapshotDataManage.removeSnapshotInfo(clientId)
  }

  getDislikeRules = async() => {
    return getLocalDislikeData()
  }
}

