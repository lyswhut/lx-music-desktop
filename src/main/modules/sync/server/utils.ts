import { toMD5 } from '@common/utils/nodejs'
import type http from 'node:http'
import {
  getSnapshotInfo,
  saveSnapshot,
  saveSnapshotInfo,
  type SnapshotInfo,
} from '../data'
import { getLocalListData } from '../utils'

export const generateCode = (): string => {
  return Math.random().toString().substring(2, 8)
}

export const getIP = (request: http.IncomingMessage) => {
  return request.socket.remoteAddress
}

export const encryptMsg = (keyInfo: LX.Sync.ServerKeyInfo, msg: string): string => {
  return msg
  // if (!keyInfo) return ''
  // return aesEncrypt(msg, keyInfo.key, keyInfo.iv)
}

export const decryptMsg = (keyInfo: LX.Sync.ServerKeyInfo, enMsg: string): string => {
  return enMsg
  // if (!keyInfo) return ''
  // let msg = ''
  // try {
  //   msg = aesDecrypt(enMsg, keyInfo.key, keyInfo.iv)
  // } catch (err) {
  //   console.log(err)
  // }
  // return msg
}

let snapshotInfo: SnapshotInfo
export const createSnapshot = async() => {
  if (!snapshotInfo) snapshotInfo = getSnapshotInfo()
  const listData = JSON.stringify(await getLocalListData())
  const md5 = toMD5(listData)
  if (snapshotInfo.latest == md5) return md5
  if (snapshotInfo.list.includes(md5)) {
    snapshotInfo.list.splice(snapshotInfo.list.indexOf(md5), 1)
  } else await saveSnapshot(md5, listData)
  if (snapshotInfo.latest) snapshotInfo.list.unshift(snapshotInfo.latest)
  snapshotInfo.latest = md5
  snapshotInfo.time = Date.now()
  saveSnapshotInfo(snapshotInfo)
  return md5
}


export const getCurrentListInfoKey = async() => {
  // if (!snapshotInfo) snapshotInfo = getSnapshotInfo()
  return createSnapshot()
}
