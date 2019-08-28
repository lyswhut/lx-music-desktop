import { httpFatch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../messoer'

const api_messoer = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFatch(`https://v1.itooi.cn/netease/url?id=${songInfo.songmid}&quality=${type.replace(/k$/, '')}&isRedirect=0`, {
      method: 'get',
      timeout,
      headers,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 200 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getPic(songInfo) {
    const requestObj = httpFatch(`https://v1.itooi.cn/netease/pic?id=${songInfo.songmid}&isRedirect=0`, {
      method: 'get',
      timeout,
      headers,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 200 ? Promise.resolve(body.data) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getLyric(songInfo) {
    const requestObj = httpFatch(`https://v1.itooi.cn/netease/lrc?id=${songInfo.songmid}&isRedirect=0`, {
      method: 'get',
      timeout,
      headers,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body ? Promise.resolve(body) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
}

export default api_messoer
