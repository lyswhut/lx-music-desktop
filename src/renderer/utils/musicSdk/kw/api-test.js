import { httpFetch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'
import { dnsLookup } from '../utils'

const api_test = {
  // getMusicUrl(songInfo, type) {
  //   const requestObj = httpFetch(`http://45.32.53.128:3002/m/kw/u/${songInfo.songmid}/${type}`, {
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
    const requestObj = httpFetch(`http://ts.tempmusics.tk/url/kw/${songInfo.songmid}/${type}`, {
      method: 'get',
      timeout,
      headers,
      lookup: dnsLookup,
      family: 4,
    })
    requestObj.promise = requestObj.promise.then(({ statusCode, body }) => {
      if (statusCode == 429) return Promise.reject(new Error(requestMsg.tooManyRequests))
      switch (body.code) {
        case 0: return Promise.resolve({ type, url: body.data })
        default: return Promise.reject(new Error(requestMsg.fail))
      }
    })
    return requestObj
  },
}

export default api_test
