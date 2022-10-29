import { httpGet } from './request'
import { author, name } from '../../../package.json'

// TODO add Notice

export const getVersionInfo = async(retryNum = 0) => {
  return await new Promise((resolve, reject) => {
    httpGet(`https://raw.githubusercontent.com/${author.name}/${name}/master/publish/version.json`, {
      timeout: 20000,
    }, (err, resp, body) => {
      if (err) {
        return ++retryNum > 3
          ? getVersionInfo2().then(resolve).catch(reject)
          : getVersionInfo(retryNum).then(resolve).catch(reject)
      }
      resolve(body)
    })
  })
}

const getVersionInfo2 = async(retryNum = 0) => {
  return await new Promise((resolve, reject) => {
    httpGet('https://gitee.com/lyswhut/lx-music-desktop-versions/raw/master/version.json', {
      timeout: 20000,
    }, (err, resp, body) => {
      if (!err && !body.version) err = new Error(JSON.stringify(body))
      if (err) {
        return ++retryNum > 3
          ? getVersionInfo3().then(resolve).catch(reject)
          : getVersionInfo2(retryNum).then(resolve).catch(reject)
      }
      resolve(body)
    })
  })
}

const getVersionInfo3 = async(retryNum = 0) => {
  return await new Promise((resolve, reject) => {
    httpGet('https://cdn.stsky.cn/lx-music/desktop/version.json', {
      timeout: 20000,
    }, (err, resp, body) => {
      if (err) {
        return ++retryNum > 3
          ? reject(err)
          : getVersionInfo3(retryNum).then(resolve).catch(reject)
      }
      resolve(body)
    })
  })
}
