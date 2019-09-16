import { httpFatch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'

const api_test = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFatch(`http://ts.tempmusic.tk/url/wy/${songInfo.songmid}/${type}`, {
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
    const requestObj = httpFatch(`http://ts.tempmusic.tk/pic/wy/${songInfo.songmid}`, {
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
    const requestObj = httpFatch(`http://ts.tempmusic.tk/lrc/wy/${songInfo.songmid}`, {
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
