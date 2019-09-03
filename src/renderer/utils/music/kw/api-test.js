import { httpFatch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'

const api_test = {
  // getMusicUrl(songInfo, type) {
  //   const requestObj = httpFatch(`http://45.32.53.128:3002/m/kw/u/${songInfo.songmid}/${type}`, {
  //     method: 'get',
  //     headers,
  //     timeout,
  //   })
  //   requestObj.promise = requestObj.promise.then(({ body }) => {
  //     return body.code === 0 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(body.msg))
  //   })
  //   return requestObj
  // },
  getMusicUrl(songInfo, type) {
    const requestObj = httpFatch(`http://test.tempmusic.tk/url/kw/${songInfo.songmid}/${type}`, {
      method: 'get',
      timeout,
      headers,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
}

export default api_test
