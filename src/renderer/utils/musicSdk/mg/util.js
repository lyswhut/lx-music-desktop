import { toMD5 } from '../utils'

export const encode = (keyword, timestamp) => {
  const deviceId = '963B7AA0D21511ED807EE5846EC87D16'
  const signatureMd5 = '6cdc72a439cef99a3418d2a78aa28c73'
  const text = `${keyword}${signatureMd5}yyapp2d16148780a1dcc7408e06336b98cfd50${deviceId}${timestamp}`
  return { sign: toMD5(text), deviceId }
}

