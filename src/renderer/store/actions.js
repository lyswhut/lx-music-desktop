// import api from 'api/connom'
import { httpGet } from '../utils/request'

export default {
  getVersionInfo(state, retryNum = 0) {
    return new Promise((resolve, reject) => {
      httpGet('https://www.sixyin.com/version/lx_music_by_wy/version.json', {
        timeout: 20000,
      }, (err, resp, body) => {
        if (err) {
          return ++retryNum > 3
            ? reject(err)
            : this.dispatch('getVersionInfo', retryNum).then(resolve).catch(reject)
        }
        resolve(body)
      })
    })
  },
}
