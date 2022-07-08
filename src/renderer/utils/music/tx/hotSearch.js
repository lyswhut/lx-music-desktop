import { httpFetch } from '../../request'

export default {
  _requestObj: null,
  async getList(retryNum = 0) {
    if (this._requestObj) this._requestObj.cancelHttp()
    if (retryNum > 2) return Promise.reject(new Error('try max num'))

    // const _requestObj = httpFetch('https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg', {
    //   method: 'get',
    //   headers: {
    //     Referer: 'https://y.qq.com/portal/player.html',
    //   },
    // })
    const _requestObj = httpFetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'post',
      body: {
        comm: {
          ct: '19',
          cv: '1803',
          guid: '0',
          patch: '118',
          psrf_access_token_expiresAt: 0,
          psrf_qqaccess_token: '',
          psrf_qqopenid: '',
          psrf_qqunionid: '',
          tmeAppID: 'qqmusic',
          tmeLoginType: 0,
          uin: '0',
          wid: '0',
        },
        hotkey: {
          method: 'GetHotkeyForQQMusicPC',
          module: 'tencent_musicsoso_hotkey.HotkeyService',
          param: {
            search_id: '',
            uin: 0,
          },
        },
      },
      headers: {
        Referer: 'https://y.qq.com/portal/player.html',
      },
    })
    const { body, statusCode } = await _requestObj.promise
    // console.log(body)
    if (statusCode != 200 || body.code !== 0) throw new Error('获取热搜词失败')
    // console.log(body)
    return { source: 'tx', list: this.filterList(body.hotkey.data.vec_hotkey) }
  },
  filterList(rawList) {
    return rawList.map(item => item.query)
  },
}
