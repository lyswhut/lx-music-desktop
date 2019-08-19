import { httpFatch } from '../../request'
import { requestMsg } from '../../message'

const api_messoer = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFatch(`https://v1.itooi.cn/kugou/url?id=${songInfo._types[type].hash}&quality=${type.replace(/k$/, '')}&isRedirect=0`, {
      method: 'get',
      timeout: 5000,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 200 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getPic(songInfo) {
    const requestObj = httpFatch(`https://v1.itooi.cn/kugou/pic?id=${songInfo.hash}&isRedirect=0`, {
      method: 'get',
      timeout: 5000,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 200 ? Promise.resolve(body.data) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getLyric(songInfo) {
    const requestObj = httpFatch(`https://v1.itooi.cn/kugou/lrc?id=${songInfo.hash}&isRedirect=0`, {
      method: 'get',
      timeout: 5000,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body ? Promise.resolve(body) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
}

export default api_messoer
