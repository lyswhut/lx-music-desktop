import { httpFetch } from '../../request'

export default {
  getAlbum(songInfo, tryNum = 0) {
    let requestObj = httpFetch(`http://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/queryAlbumSong?albumId=${songInfo.albumId}&pageNo=1`)
    requestObj.promise = requestObj.promise.then(({ body }) => {
      if (body.code !== '000000') {
        if (tryNum > 5) return Promise.reject('获取专辑失败')
        let tryRequestObj = this.getAlbum(songInfo, ++tryNum)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }
      // console.log(body)
      return body.songList
    })
    return requestObj
  },
}
