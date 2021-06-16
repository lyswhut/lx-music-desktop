import { httpFetch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'
import { getHostIp } from '../utils'

const api_test = {
  getMusicUrl(songInfo, type) {
    const ip = getHostIp('ts.tempmusic.tk')
    const requestObj = httpFetch(`http://ts.tempmusic.tk/url/kg/${songInfo._types[type].hash}/${type}`, {
      method: 'get',
      timeout,
      headers,
      host: ip,
      family: 4,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getPic(songInfo) {
    const requestObj = httpFetch(`http://ts.tempmusic.tk/pic/kg/${songInfo.hash}`, {
      method: 'get',
      timeout,
      headers,
      family: 4,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve(body.data) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getLyric(songInfo) {
    const requestObj = httpFetch(`http://ts.tempmusic.tk/lrc/kg/${songInfo.hash}`, {
      method: 'get',
      timeout,
      headers,
      family: 4,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve(body.data) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
}

export default api_test
