const { app } = require('electron')
const { networkInterfaces } = require('os')
const { randomBytes, createCipheriv, createDecipheriv } = require('crypto')
const path = require('path')
const getStore = require('@common/store')
const STORE_NAME = 'sync'

exports.getAddress = () => {
  const nets = networkInterfaces()
  const results = []
  // console.log(nets)

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address)
      }
    }
  }
  return results
}

let serverId
exports.getServerId = () => {
  if (serverId) return serverId
  const store = getStore(STORE_NAME)
  serverId = store.get('serverId')
  if (!serverId) {
    serverId = randomBytes(4 * 4).toString('base64')
    store.set('serverId', serverId)
  }
  return serverId
}

let keyInfos
exports.createClientKeyInfo = deviceName => {
  const keyInfo = {
    clientId: randomBytes(4 * 4).toString('base64'),
    key: randomBytes(16).toString('base64'),
    iv: randomBytes(16).toString('base64'),
    deviceName,
  }
  const store = getStore(STORE_NAME)
  if (!keyInfos) keyInfos = store.get('keys') || {}
  if (Object.keys(keyInfos).length > 101) throw new Error('max keys')

  keyInfos[keyInfo.clientId] = keyInfo
  store.set('keys', keyInfos)
  return keyInfo
}
exports.setClientKeyInfo = keyInfo => {
  keyInfos[keyInfo.clientId] = keyInfo
  const store = getStore(STORE_NAME)
  store.set('keys', keyInfos)
}
exports.getClientKeyInfo = clientId => {
  if (!keyInfos) {
    const store = getStore(STORE_NAME)
    keyInfos = store.get('keys') || {}
  }
  return keyInfos[clientId] || null
}

exports.generateCode = () => {
  return Math.random().toString().substring(2, 8)
}

exports.aesEncrypt = (buffer, key, iv) => {
  const cipher = createCipheriv('aes-128-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))
  return Buffer.concat([cipher.update(buffer), cipher.final()]).toString('base64')
}

exports.aesDecrypt = (text, key, iv) => {
  const decipher = createDecipheriv('aes-128-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString()
}

exports.encryptMsg = (keyInfo, msg) => {
  return msg
  // if (!keyInfo) return ''
  // return exports.aesEncrypt(msg, keyInfo.key, keyInfo.iv)
}

exports.decryptMsg = (keyInfo, enMsg) => {
  return enMsg
  // if (!keyInfo) return ''
  // let msg = ''
  // try {
  //   msg = exports.aesDecrypt(enMsg, keyInfo.key, keyInfo.iv)
  // } catch (err) {
  //   console.log(err)
  // }
  // return msg
}

exports.getSnapshotFilePath = keyInfo => {
  return path.join(app.getPath('userData'), `snapshot-${Buffer.from(keyInfo.clientId).toString('hex').substring(0, 10)}.json`)
}
