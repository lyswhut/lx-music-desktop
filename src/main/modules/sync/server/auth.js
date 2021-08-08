const { aesEncrypt, aesDecrypt, createClientKeyInfo, getClientKeyInfo, setClientKeyInfo } = require('./utils')

const authMsg = 'lx-music auth::'
const helloMsg = 'Hello~::^-^::'

exports.authCode = async(req, res, authCode) => {
  let code = 401
  let msg = 'Forbidden'
  // console.log(req.headers)
  if (req.headers.m) {
    label:
    if (req.headers.i) {
      const keyInfo = getClientKeyInfo(req.headers.i)
      if (!keyInfo) break label
      let text
      try {
        text = aesDecrypt(req.headers.m, keyInfo.key, keyInfo.iv)
      } catch (err) {
        break label
      }
      console.log(text)
      if (text.startsWith(authMsg)) {
        code = 200
        const deviceName = text.replace(authMsg, '') || 'Unknown'
        if (deviceName != keyInfo.deviceName) {
          keyInfo.deviceName = deviceName
          setClientKeyInfo(keyInfo)
        }
        msg = aesEncrypt(helloMsg, keyInfo.key, keyInfo.iv)
      }
    } else {
      let key = ''.padStart(16, Buffer.from(authCode).toString('hex'))
      const iv = Buffer.from(key.split('').reverse().join('')).toString('base64')
      key = Buffer.from(key).toString('base64')
      // console.log(authCode, key, iv)
      let text
      try {
        text = aesDecrypt(req.headers.m, key, iv)
      } catch (err) {
        break label
      }
      console.log(text)
      if (text.startsWith(authMsg)) {
        code = 200
        const deviceName = text.replace(authMsg, '') || 'Unknown'
        msg = aesEncrypt(JSON.stringify(createClientKeyInfo(deviceName)), key, iv)
      }
    }
  }
  res.writeHead(code)
  res.end(msg)
}

exports.authConnect = async req => {
  const { i, t } = req._query
  label:
  if (i && t) {
    const keyInfo = getClientKeyInfo(i)
    if (!keyInfo) break label
    let text
    try {
      text = aesDecrypt(t, keyInfo.key, keyInfo.iv)
    } catch (err) {
      break label
    }
    if (text == 'lx-music connect') return
  }
  throw new Error('failed')
}
