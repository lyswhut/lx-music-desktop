import { httpFatch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'

const api_test = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFatch(`http://test.tempmusic.tk/url/kg/${songInfo._types[type].hash}/${type}`, {
      method: 'get',
      timeout,
      headers,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getPic(songInfo) {
    const requestObj = httpFatch(`http://test.tempmusic.tk/pic/kg/${songInfo.hash}`, {
      method: 'get',
      timeout,
      headers,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve(body.data) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getLyric(songInfo) {
    const requestObj = httpFatch(`http://test.tempmusic.tk/lrc/kg/${songInfo.hash}`, {
      method: 'get',
      timeout,
      headers,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve(body.data) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
}

export default api_test
