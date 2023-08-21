import WebSocket from 'ws'
import { encryptMsg, decryptMsg } from './utils'
import { modules, callObj } from './modules'
// import { action as commonAction } from '@root/store/modules/common'
// import { getStore } from '@root/store'
// import registerSyncListHandler from './syncList'
import log from '../log'
import { SYNC_CLOSE_CODE, SYNC_CODE } from '@common/constants'
import { dateFormat } from '@common/utils/common'
import { aesEncrypt, getAddress } from '../utils'
import { sendClientStatus } from '@main/modules/winMain'
import { createMsg2call } from 'message2call'

let status: LX.Sync.ClientStatus = {
  status: false,
  message: '',
  address: [],
}

export const sendSyncStatus = (newStatus: Omit<LX.Sync.ClientStatus, 'address'>) => {
  status.status = newStatus.status
  status.message = newStatus.message
  if (status.status) {
    status.address = getAddress()
  }
  sendClientStatus(status)
}

export const sendSyncMessage = (message: string) => {
  status.message = message
  sendClientStatus(status)
}

const handleConnection = (socket: LX.Sync.Client.Socket) => {
  for (const { registerEvent } of Object.values(modules)) {
    registerEvent(socket)
  }
}

const handleDisconnection = () => {
  for (const { unregisterEvent } of Object.values(modules)) {
    unregisterEvent()
  }
}

const heartbeatTools = {
  failedNum: 0,
  maxTryNum: 100000,
  stepMs: 3000,
  pingTimeout: null as NodeJS.Timeout | null,
  delayRetryTimeout: null as NodeJS.Timeout | null,
  handleOpen() {
    console.log('open')
    // this.failedNum = 0
    this.heartbeat()
  },
  heartbeat() {
    if (this.pingTimeout) clearTimeout(this.pingTimeout)

    // Use `WebSocket#terminate()`, which immediately destroys the connection,
    // instead of `WebSocket#close()`, which waits for the close timer.
    // Delay should be equal to the interval at which your server
    // sends out pings plus a conservative assumption of the latency.
    this.pingTimeout = setTimeout(() => {
      client?.terminate()
    }, 30000 + 1000)
  },
  reConnnect() {
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout)
      this.pingTimeout = null
    }
    // client = null
    if (!client) return

    if (++this.failedNum > this.maxTryNum) {
      this.failedNum = 0
      throw new Error('connect error')
    }

    const waitTime = Math.min(2000 + Math.floor(this.failedNum / 2) * this.stepMs, 15000)

    // sendSyncStatus({
    //   status: false,
    //   message: `Waiting ${waitTime / 1000}s reconnnect...`,
    // })

    this.delayRetryTimeout = setTimeout(() => {
      this.delayRetryTimeout = null
      if (!client) return
      console.log(dateFormat(new Date()), 'reconnnect...')
      sendSyncStatus({
        status: false,
        message: `Try reconnnect... (${this.failedNum})`,
      })
      connect(client.data.urlInfo, client.data.keyInfo)
    }, waitTime)
  },
  clearTimeout() {
    if (this.delayRetryTimeout) {
      clearTimeout(this.delayRetryTimeout)
      this.delayRetryTimeout = null
    }
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout)
      this.pingTimeout = null
    }
  },
  connect(socket: LX.Sync.Client.Socket) {
    console.log('heartbeatTools connect')
    socket.on('open', () => {
      this.handleOpen()
    })
    socket.on('ping', () => {
      this.heartbeat()
    })
    socket.on('close', (code) => {
      console.log(code)
      switch (code) {
        case SYNC_CLOSE_CODE.normal:
        case SYNC_CLOSE_CODE.failed:
          return
      }
      this.reConnnect()
    })
  },
}


let client: LX.Sync.Client.Socket | null
// let listSyncPromise: Promise<void>
export const connect = (urlInfo: LX.Sync.Client.UrlInfo, keyInfo: LX.Sync.ClientKeyInfo) => {
  client = new WebSocket(`${urlInfo.wsProtocol}//${urlInfo.hostPath}/socket?i=${encodeURIComponent(keyInfo.clientId)}&t=${encodeURIComponent(aesEncrypt(SYNC_CODE.msgConnect, keyInfo.key))}`, {
  }) as LX.Sync.Client.Socket
  client.data = {
    keyInfo,
    urlInfo,
  }
  heartbeatTools.connect(client)

  let closeEvents: Array<(err: Error) => (void | Promise<void>)> = []

  const message2read = createMsg2call({
    funcsObj: {
      ...callObj,
      list_sync_finished() {
        log.info('sync list success')
        client!.isReady = true
        handleConnection(client as LX.Sync.Client.Socket)
        sendSyncStatus({
          status: true,
          message: '',
        })
        heartbeatTools.failedNum = 0
      },
    },
    timeout: 120 * 1000,
    sendMessage(data) {
      void encryptMsg(keyInfo, JSON.stringify(data)).then((data) => {
        client?.send(data)
      }).catch((err) => {
        log.error('encrypt msg error: ', err)
        client?.close(SYNC_CLOSE_CODE.failed)
      })
    },
    onCallBeforeParams(rawArgs) {
      return [client, ...rawArgs]
    },
    onError(error, path, groupName) {
      const name = groupName ?? ''
      log.error(`sync call ${name} ${path.join('.')} error:`, error)
      if (groupName == null) return
      client?.close(SYNC_CLOSE_CODE.failed)
      sendSyncStatus({
        status: false,
        message: error.message,
      })
    },
  })

  client.remoteSyncList = message2read.createSyncRemote('list')

  client.addEventListener('message', ({ data }) => {
    if (data == 'ping') return
    if (typeof data === 'string') {
      void decryptMsg(keyInfo, data).then((data) => {
        let syncData: LX.Sync.ServerActions
        try {
          syncData = JSON.parse(data)
        } catch (err) {
          log.error('parse msg error: ', err)
          client?.close(SYNC_CLOSE_CODE.failed)
          return
        }
        message2read.onMessage(syncData)
      }).catch((error) => {
        log.error('decrypt msg error: ', error)
        client?.close(SYNC_CLOSE_CODE.failed)
      })
    }
  })
  client.onClose = function(handler: typeof closeEvents[number]) {
    closeEvents.push(handler)
    return () => {
      closeEvents.splice(closeEvents.indexOf(handler), 1)
    }
  }

  const initMessage = 'Wait syncing...'
  client.addEventListener('open', () => {
    log.info('connect')
    // const store = getStore()
    // global.lx.syncKeyInfo = keyInfo
    client!.isReady = false
    sendSyncStatus({
      status: false,
      message: initMessage,
    })
  })
  client.addEventListener('close', ({ code }) => {
    const err = new Error('closed')
    try {
      for (const handler of closeEvents) void handler(err)
    } catch (err: any) {
      log.error(err?.message)
    }
    closeEvents = []
    handleDisconnection()
    message2read.onDestroy()
    switch (code) {
      case SYNC_CLOSE_CODE.normal:
      // case SYNC_CLOSE_CODE.failed:
        sendSyncStatus({
          status: false,
          message: '',
        })
        break
      case SYNC_CLOSE_CODE.failed:
        if (!status.message || status.message == initMessage) {
          sendSyncStatus({
            status: false,
            message: 'failed',
          })
        }
        break
    }
  })
  client.addEventListener('error', ({ message }) => {
    sendSyncStatus({
      status: false,
      message,
    })
  })
}

export const disconnect = async() => {
  if (!client) return
  log.info('disconnecting...')
  client.close(SYNC_CLOSE_CODE.normal)
  client = null
  heartbeatTools.clearTimeout()
  heartbeatTools.failedNum = 0
}

export const getStatus = (): LX.Sync.ClientStatus => status
