import { httpGet, httpFetch } from '../../request'
// import { rendererInvoke, NAMES } from '../../../../common/ipc'

const kw_token = {
  token: null,
  isGetingToken: false,
}

const translationMap = {
  "{'": '{"',
  "'}\n": '"}',
  "'}": '"}',
  "':'": '":"',
  "','": '","',
  "':{'": '":{"',
  "':['": '":["',
  "'}],'": '"}],"',
  "':[{'": '":[{"',
  "'},'": '"},"',
  "'},{'": '"},{"',
  "':[],'": '":[],"',
  "':{},'": '":{},"',
}

export const objStr2JSON = str => {
  return JSON.parse(str.replace(/(^{'|'}\n$|'}$|':'|','|':\[{'|'}\],'|':{'|'},'|'},{'|':\['|':\[\],'|':{},')/g, s => translationMap[s]))
}

export const formatSinger = rawData => rawData.replace(/&/g, '、')

export const matchToken = headers => {
  try {
    return headers['set-cookie'][0].match(/kw_token=(\w+)/)[1]
  } catch (err) {
    return null
  }
}

const wait = time => new Promise(resolve => setTimeout(() => resolve(), time))


export const getToken = (retryNum = 0) => new Promise((resolve, reject) => {
  if (retryNum > 2) return Promise.reject(new Error('try max num'))

  if (kw_token.isGetingToken) return wait(1000).then(() => getToken(retryNum).then(token => resolve(token)))
  if (kw_token.token) return resolve(kw_token.token)
  kw_token.isGetingToken = true
  httpGet('http://www.kuwo.cn/', (err, resp) => {
    kw_token.isGetingToken = false
    if (err) return getToken(++retryNum)
    if (resp.statusCode != 200) return reject(new Error('获取失败'))
    const token = kw_token.token = matchToken(resp.headers)
    resolve(token)
  })
})

// export const decodeLyric = base64Data => rendererInvoke(NAMES.mainWindow.handle_kw_decode_lyric, base64Data)

export const tokenRequest = async(url, options = {}) => {
  let token = kw_token.token
  if (!token) token = await getToken()
  if (!options.headers) {
    options.headers = {
      Referer: 'http://www.kuwo.cn/',
      csrf: token,
      cookie: 'kw_token=' + token,
    }
  }
  const requestObj = httpFetch(url, options)
  requestObj.promise = requestObj.promise.then(resp => {
    // console.log(resp)
    if (resp.statusCode == 200) {
      kw_token.token = matchToken(resp.headers)
    }
    return resp
  })
  return requestObj
}
