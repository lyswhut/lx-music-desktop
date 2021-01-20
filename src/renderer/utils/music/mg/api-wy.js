import { httpFetch } from '../../request'
import { requestMsg } from '../../message'
import { headers, timeout } from '../options'

const api_wy = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFetch(`https://api.sixyin.com/url/mg/${songInfo.copyrightId}/${type}`, {
      method: 'get',
      timeout,
      headers,
      family: 4,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
}

export default api_wy
