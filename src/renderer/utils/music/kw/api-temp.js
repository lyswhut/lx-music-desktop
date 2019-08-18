import { httpFatch } from '../../request'

const api_temp = {
  getMusicUrl(songInfo, type) {
    const requestObj = httpFatch(`https://www.stsky.cn/api/temp/getMusicUrl.php?id=${songInfo.songmid}&type=${type}`, {
      method: 'get',
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve({ type, url: body.data }) : Promise.reject(new Error(body.msg))
    }).catch(err => {
      console.log(err)
      if (err.message === 'socket hang up') return Promise.reject(new Error('接口挂了'))
      if (err.code === 'ENOTFOUND') return Promise.reject(new Error('无法连接网络'))
      return Promise.reject(err)
    })
    return requestObj
  },
  getPic(songInfo) {
    const requestObj = httpFatch(`https://www.stsky.cn/api/temp/getPic.php?size=320&songmid=${songInfo.songmid}`, {
      method: 'get',
    })
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.code === 0 ? Promise.resolve(body.data) : Promise.reject(new Error(body.msg))
    }).catch(err => {
      if (err.message === 'socket hang up') return Promise.reject(new Error('接口挂了'))
      if (err.code === 'ENOTFOUND') return Promise.reject(new Error('无法连接网络'))
      return Promise.reject(err)
    })
    return requestObj
  },
}

export default api_temp
