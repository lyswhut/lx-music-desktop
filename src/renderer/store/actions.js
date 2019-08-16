// import api from 'api/connom'
import { httpGet } from '../utils/request'
import { author, name } from '../../../package.json'

export default {
  getVersionInfo() {
    return new Promise((resolve, reject) => {
      httpGet(`https://raw.githubusercontent.com/${author}/${name}/master/publish/version.json`, (err, resp, body) => {
        if (err) return reject(err)
        resolve(body)
      })
    })
  },
}
