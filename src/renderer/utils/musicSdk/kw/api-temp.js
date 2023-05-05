import { httpFetch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'
import { dnsLookup } from '../utils'

const api_temp = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFetch(`http://tm.tempmusics.tk/url/kw/${songInfo.songmid}/${type}`, {
      method: 'get',
      headers,
      timeout,
      lookup: dnsLookup,
      family: 4,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      switch (body.code) {
        case 0: return Promise.resolve({ type, url: body.data })
        case 429: return Promise.reject(new Error(requestMsg.tooManyRequests))
        default: return Promise.reject(new Error(body.msg))
      }
    })
    return requestObj
  },
}

export default api_temp
