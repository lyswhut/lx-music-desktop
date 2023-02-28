import handleAuth from './auth'
import { connect as socketConnect, disconnect as socketDisconnect, sendSyncStatus, sendSyncMessage } from './client'
// import { getSyncHost } from '@/utils/data'
import { SYNC_CODE } from '@common/constants'
import log from '../log'
import { parseUrl } from './utils'

const handleConnect = async(host: string, authCode?: string) => {
  // const hostInfo = await getSyncHost()
  // console.log(hostInfo)
  // if (!hostInfo || !hostInfo.host || !hostInfo.port) throw new Error(SYNC_CODE.unknownServiceAddress)
  const urlInfo = parseUrl(host)
  await disconnectServer(false)
  const keyInfo = await handleAuth(urlInfo, authCode)
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
  return handleConnect(host, authCode).then(() => {
    sendSyncStatus({
      status: true,
      message: '',
    })
  }).catch(async err => {
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
