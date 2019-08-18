import { httpFatch } from '../../request'

const api_messoer = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFatch(`https://v1.itooi.cn/tencent/url?id=${songInfo.strMediaMid}&quality=${type.replace(/k$/, '')}&isRedirect=0`, {
      method: 'get',
      timeout: 5000,
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 200 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(body.msg))
    })
    return requestObj
  },
  getPic(songInfo) {
    return {
      promise: Promise.resolve(`https://y.gtimg.cn/music/photo_new/T002R500x500M000${songInfo.albumId}.jpg`),
    }
  },
}

export default api_messoer
