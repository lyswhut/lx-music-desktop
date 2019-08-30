import { httpFatch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'

const api_test = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFatch(`http://45.32.53.128:3000/kugou/url?id=${songInfo._types[type].hash}&quality=${type.replace(/k$/, '')}`, {
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
    const requestObj = httpFatch(`http://45.32.53.128:3000/kugou/pic?id=${songInfo.hash}`, {
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
    const requestObj = httpFatch(`http://45.32.53.128:3000/kugou/lrc?id=${songInfo.hash}`, {
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

export default api_test
