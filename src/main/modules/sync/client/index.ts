import handleAuth from './auth'
import { connect as socketConnect, disconnect as socketDisconnect, sendSyncStatus, sendSyncMessage } from './client'
// import { getSyncHost } from '@root/utils/data'
import log from '../log'
import { parseUrl } from './utils'
import migrateData from '../migrate'
import { SYNC_CODE } from '@common/constants_sync'

let connectId = 0

const handleConnect = async(host: string, authCode?: string) => {
  // const hostInfo = await getSyncHost()
  // console.log(hostInfo)
  // if (!hostInfo || !hostInfo.host || !hostInfo.port) throw new Error(SYNC_CODE.unknownServiceAddress)
  const id = connectId
  const urlInfo = parseUrl(host)
  await disconnectServer(false)
  if (id != connectId) return
  const keyInfo = await handleAuth(urlInfo, authCode)
  if (id != connectId) return
  socketConnect(urlInfo, keyInfo)
}
const handleDisconnect = async() => {
  await socketDisconnect()
}

const connectServer = async(host: string, authCode?: string) => {
  sendSyncStatus({
    status: false,
    message: SYNC_CODE.connecting,
  })
  const id = connectId
  await migrateData(global.lxDataPath)

  return handleConnect(host, authCode).catch(async err => {
    if (id != connectId) return
    sendSyncStatus({
      status: false,
      message: err.message,
    })
    switch (err.message) {
      case SYNC_CODE.connectServiceFailed:
      case SYNC_CODE.missingAuthCode:
        break
      default:
        log.r_warn(err.message)
        break
    }

    return Promise.reject(err)
  })
}

const disconnectServer = async(isResetStatus = true) => handleDisconnect().then(() => {
  log.info('disconnect...')
  if (isResetStatus) {
    connectId++
    sendSyncStatus({
      status: false,
      message: '',
    })
  }
}).catch((err: any) => {
  log.error(`disconnect error: ${err.message as string}`)
  sendSyncMessage(err.message)
})

export {
  connectServer,
  disconnectServer,
}

export {
  getStatus,
} from './client'
