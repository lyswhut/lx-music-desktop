import WebSocket from 'ws'
import { encryptMsg, decryptMsg } from './utils'
import * as modules from './modules'
// import { action as commonAction } from '@/store/modules/common'
// import { getStore } from '@/store'
import registerSyncListHandler from './syncList'
import log from '../log'
import { SYNC_CLOSE_CODE, SYNC_CODE } from '@common/constants'
import { dateFormat } from '@common/utils/common'
import { aesEncrypt, getAddress } from '../utils'
import { sendClientStatus } from '@main/modules/winMain'

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
  for (const moduleInit of Object.values(modules)) {
    moduleInit(socket)
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
  client = new WebSocket(`${urlInfo.wsProtocol}//${urlInfo.hostPath}?i=${encodeURIComponent(keyInfo.clientId)}&t=${encodeURIComponent(aesEncrypt(SYNC_CODE.msgConnect, keyInfo.key))}`, {
  }) as LX.Sync.Client.Socket
  client.data = {
    keyInfo,
    urlInfo,
  }
  heartbeatTools.connect(client)

  // listSyncPromise = registerSyncListHandler(socket)
  let events: Partial<{ [K in keyof LX.Sync.ActionSyncSendType]: Array<(data: LX.Sync.ActionSyncSendType[K]) => (void | Promise<void>)> }> = {}
  let closeEvents: Array<(err: Error) => (void | Promise<void>)> = []
  client.addEventListener('message', ({ data }) => {
    if (data == 'ping') return
    if (typeof data === 'string') {
      let syncData: LX.Sync.ActionSync
      try {
        syncData = JSON.parse(decryptMsg(keyInfo, data))
      } catch {
        return
      }
      const handlers = events[syncData.action]
      if (handlers) {
        // @ts-expect-error
        for (const handler of handlers) void handler(syncData.data)
      }
    }
  })
  client.onRemoteEvent = function(eventName, handler) {
    let eventArr = events[eventName]
    if (!eventArr) events[eventName] = eventArr = []
    // let eventArr = events.get(eventName)
    // if (!eventArr) events.set(eventName, eventArr = [])
    eventArr.push(handler)

    return () => {
      eventArr!.splice(eventArr!.indexOf(handler), 1)
    }
  }
  client.sendData = function(eventName, data, callback) {
    client?.send(encryptMsg(keyInfo, JSON.stringify({ action: eventName, data })), callback)
  }
  client.onClose = function(handler: typeof closeEvents[number]) {
    closeEvents.push(handler)
    return () => {
      closeEvents.splice(closeEvents.indexOf(handler), 1)
    }
  }

  client.addEventListener('open', () => {
    log.info('connect')
    // const store = getStore()
    // global.lx.syncKeyInfo = keyInfo
    client!.isReady = false
    sendSyncStatus({
      status: false,
      message: 'Wait syncing...',
    })
    void registerSyncListHandler(client as LX.Sync.Client.Socket).then(() => {
      log.info('sync list success')
      handleConnection(client as LX.Sync.Client.Socket)
      log.info('register list sync service success')
      client!.isReady = true
      heartbeatTools.failedNum = 0
      sendSyncStatus({
        status: true,
        message: '',
      })
    }).catch(err => {
      if (err.message == 'closed') {
        sendSyncStatus({
          status: false,
          message: '',
        })
      } else {
        console.log(err)
        log.r_error(err.stack)
        sendSyncStatus({
          status: false,
          message: err.message,
        })
      }
    })
  })
  client.addEventListener('close', ({ code }) => {
    const err = new Error('closed')
    for (const handler of closeEvents) void handler(err)
    closeEvents = []
    events = {}
    switch (code) {
      case SYNC_CLOSE_CODE.normal:
      // case SYNC_CLOSE_CODE.failed:
        sendSyncStatus({
          status: false,
          message: '',
        })
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
