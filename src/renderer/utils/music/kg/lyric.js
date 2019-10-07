import { httpFetch } from '../../request'

export default {
  getIntv(interval) {
    let intvArr = interval.split(':')
    let intv = 0
    let unit = 1
    while (intvArr.length) {
      intv += (intvArr.pop()) * unit
      unit *= 60
    }
    return parseInt(intv)
  },
  getLyric(songInfo, tryNum = 0) {
    let requestObj = httpFetch(`http://m.kugou.com/app/i/krc.php?cmd=100&keyword=${encodeURIComponent(songInfo.name)}&hash=${songInfo.hash}&timelength=${songInfo._interval || this.getIntv(songInfo.interval)}&d=0.38664927426725626`, {
      headers: {
        'KG-RC': 1,
        'KG-THash': 'expand_search_manager.cpp:852736169:451',
        'User-Agent': 'KuGou2012-9020-ExpandSearchManager',
      },
    })
    requestObj.promise = requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) {
        if (tryNum > 5) return Promise.reject('歌词获取失败')
        let tryRequestObj = this.getLyric(songInfo, ++tryNum)
        requestObj.cancelHttp = tryRequestObj.cancelHttp.bind(tryRequestObj)
        return tryRequestObj.promise
      }
      return body
    })
    return requestObj
  },
}
