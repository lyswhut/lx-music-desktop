import { httpGet, httpFetch } from '../../request'
import { toMD5 } from '../../index'
// import crateIsg from './isg'
import { rendererInvoke, NAMES } from '../../../../common/ipc'

if (!window.xm_token) {
  let data = window.localStorage.getItem('xm_token')
  window.xm_token = data ? JSON.parse(data) : {
    cookies: {},
    cookie: null,
    token: null,
    isGetingToken: false,
  }
  window.xm_token.isGetingToken = false
}

export const formatSinger = rawData => rawData.replace(/&/g, '、')

const matchToken = headers => {
  let cookies = {}
  let token
  for (const item of headers['set-cookie']) {
    const [key, value] = item.substring(0, item.indexOf(';')).split('=')
    cookies[key] = value
    if (key == 'xm_sg_tk') token = value.substring(0, value.indexOf('_'))
  }
  // console.log(cookies)
  return { token, cookies }
}

const wait = time => new Promise(resolve => setTimeout(() => resolve(), time))

const createToken = (token, path, params) => toMD5(`${token}_xmMain_${path}_${params}`)

const handleSaveToken = ({ token, cookies }) => {
  Object.assign(window.xm_token.cookies, cookies)
  // window.xm_token.cookies.isg = crateIsg()
  window.xm_token.cookie = Object.keys(window.xm_token.cookies).map(k => `${k}=${window.xm_token.cookies[k]};`).join(' ')
  if (token) window.xm_token.token = token

  window.localStorage.setItem('xm_token', JSON.stringify(window.xm_token))
}

export const getToken = (path, params) => new Promise((resolve, reject) => {
  if (window.xm_token.isGetingToken) return wait(1000).then(() => getToken(path, params).then(data => resolve(data)))
  if (window.xm_token.token) return resolve({ token: createToken(window.xm_token.token, path, params), cookie: window.xm_token.cookie })
  window.xm_token.isGetingToken = true
  httpGet('https://www.xiami.com/', (err, resp) => {
    window.xm_token.isGetingToken = false
    if (err) return reject(err)
    if (resp.statusCode != 200) return reject(new Error('获取失败'))

    handleSaveToken(matchToken(resp.headers))

    resolve({ token: createToken(window.xm_token.token, path, params), cookie: window.xm_token.cookie })
  })
})

const baseUrl = 'https://www.xiami.com'
export const xmRequest = (path, params = '') => {
  let query = params
  if (params != '') {
    params = JSON.stringify(params)
    query = '&_q=' + encodeURIComponent(params)
  }
  let requestObj = {
    isInited: false,
    isCancelled: false,
    cancelHttp() {
      if (!this.isInited) this.isCancelled = true
      this.requestObj.cancelHttp()
    },
  }

  requestObj.promise = getToken(path, params).then(data => {
    // console.log(data)
    if (requestObj.isCancelled) return Promise.reject('取消请求')
    let url = path
    if (!/^http/.test(path)) url = baseUrl + path
    let s = `_s=${data.token}${query}`
    url += (url.includes('?') ? '&' : '?') + s
    requestObj.requestObj = httpFetch(url, {
      headers: {
        Referer: 'https://www.xiami.com/',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
        cookie: data.cookie,
      },
    })
    return requestObj.requestObj.promise.then(resp => {
      // console.log(resp.body)
      if (resp.statusCode != 200) {
        // console.log(resp.headers)
        window.xm_token.token = null
        return Promise.reject(new Error('获取失败'))
      }
      if (resp.body.code !== 'SUCCESS' && resp.body.rgv587_flag == 'sm') {
        window.globalObj.xm.isShowVerify = true
        return wait(300).then(() => {
          return rendererInvoke(NAMES.mainWindow.handle_xm_verify_open, /^https:/.test(resp.body.url) ? resp.body.url : 'https:' + resp.body.url).then(x5sec => {
            handleSaveToken({ cookies: { x5sec } })
            // console.log(x5sec)
            window.globalObj.xm.isShowVerify = false
            return Promise.reject(new Error('获取成功'))
          }).catch(err => {
            window.globalObj.xm.isShowVerify = false
            return Promise.reject(err)
          })
        })
      }
      if (resp.headers['set-cookie']) handleSaveToken(matchToken(resp.headers))

      return Promise.resolve(resp)
    })
  })
  return requestObj
}

export const closeVerifyModal = async() => {
  if (!window.globalObj.xm.isShowVerify) return
  await rendererInvoke(NAMES.mainWindow.handle_xm_verify_close)
  window.globalObj.xm.isShowVerify = false
}
