import { httpFatch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'

const api_test = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFatch(`http://test.tempmusic.tk/url/bd/${songInfo.songmid}/${type}`, {
      method: 'get',
      timeout,
      headers,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getPic(songInfo, size = '500') {
    const requestObj = httpFatch(`http://test.tempmusic.tk/pic/bd/${songInfo.songmid}/${size}`, {
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
    const requestObj = httpFatch(`http://test.tempmusic.tk/lrc/bd/${songInfo.songmid}`, {
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
