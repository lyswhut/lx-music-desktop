import { httpFatch } from '../../request'
import { requestMsg } from '../../message'

const api_internal = {
  successCode: 2200,
  // getMusicUrl(songInfo, type) {
  //   const requestObj = httpFatch(`http://play.taihe.com/data/music/songlink`, {
  //     method: 'post',
  //     headers: {
  //       Origin: 'http://play.taihe.com',
  //     },
  //     formData: {
  //       songIds: songInfo.songmid,
  //     },
  //   })
  //   requestObj.promise = requestObj.promise.then(({ body }) => {
  //     console.log(body)
  //     return Promise.reject()
  //     // if (body.error_code !== this.successCode) return this.getMusicUrl(songInfo, type)
  //     // return body.code === 200 ? Promise.resolve({ type, url: body.result.bitrate.file_link }) : Promise.reject(new Error(requestMsg.fail))
  //   })
  //   return requestObj
  // },
  getMusicInfo(songInfo, tryNum = 0) {
    const requestObj = httpFatch(`http://tingapi.ting.baidu.com/v1/restserver/ting?from=webapp_music&method=baidu.ting.song.baseInfos&song_id=${songInfo.songmid}`)
    requestObj.promise = requestObj.promise.then(({ body }) => {
      if (body.error_code !== this.successCode) return tryNum > 5 ? Promise.reject(new Error(requestMsg.fail)) : this.getMusicInfo(songInfo, ++tryNum)
      return body ? Promise.resolve(body.result.items[0]) : Promise.reject(new Error(requestMsg.fail))
    })
    return requestObj
  },
  getPic(songInfo) {
    const requestObj = this.getMusicInfo(songInfo)
    requestObj.promise = requestObj.promise.then(info => info.pic_premium)
    return requestObj
  },
  getLyric(songInfo) {
    const requestObj = this.getMusicInfo(songInfo)
    requestObj.promise.then(info => httpFatch(info.lrclink).promise)
    return requestObj
  },
}

export default api_internal
