import { httpFetch } from '../../request'
import { headers, timeout } from '../options'
import { getHostIp } from '../utils'

const api_temp = {
  getMusicUrl(songInfo, type) {
    const ip = getHostIp('tm.tempmusic.tk')
    const requestObj = httpFetch(`http://tm.tempmusic.tk/url/kw/${songInfo.songmid}/${type}`, {
      method: 'get',
      headers,
      timeout,
      host: ip,
      family: 4,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(body.msg))
    })
    return requestObj
  },
}

export default api_temp
