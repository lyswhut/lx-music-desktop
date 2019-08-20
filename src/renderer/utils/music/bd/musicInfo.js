import { httpFatch } from '../../request'

export default {
  getMusicInfo(songmid) {
    const requestObj = httpFatch(`https://musicapi.qianqian.com/v1/restserver/ting?method=baidu.ting.song.getSongLink&format=json&from=bmpc&version=1.0.0&version_d=11.1.6.0&songid=${songmid}&type=1&res=1&s_protocol=1&aac=2&project=tpass`)
    requestObj.promise = requestObj.promise.then(({ body }) => {
      return body.error_code == 22000 ? body.reqult.songinfo : Promise.reject(new Error('获取音乐信息失败'))
    })
    return requestObj
  },
}
