import { httpFatch } from '../../request'
import { requestMsg } from '../../message'

const api_messoer = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFatch(`https://v1.itooi.cn/baidu/url?id=${songInfo.songmid}&quality=${type.replace(/k$/, '')}&isRedirect=0`, {
      method: 'get',
      timeout: 5000,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 200 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getPic(songInfo, size = '500') {
    const requestObj = httpFatch(`https://v1.itooi.cn/baidu/pic?id=${songInfo.songmid}&imageSize=${size}&isRedirect=0`, {
      method: 'get',
      timeout: 5000,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 200 ? Promise.resolve(body.data) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getLyric(songInfo) {
    const requestObj = httpFatch(`https://v1.itooi.cn/baidu/lrc?id=${songInfo.songmid}&isRedirect=0`, {
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
