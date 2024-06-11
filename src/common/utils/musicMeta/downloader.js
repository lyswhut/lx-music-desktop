const http = require('http')
const https = require('https')
const fs = require('fs')
const { httpOverHttp, httpsOverHttp } = require('tunnel')

const httpsRxp = /^https:/
const getRequestAgent = (url, proxy) => {
  return proxy ? (httpsRxp.test(url) ? httpsOverHttp : httpOverHttp)({ proxy }) : undefined
}

const sendRequest = (url, proxy) => {
  const urlParse = new URL(url)
  const httpOptions = {
    method: 'get',
    host: urlParse.hostname,
    port: urlParse.port,
    path: urlParse.pathname + urlParse.search,
    agent: getRequestAgent(url, proxy),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
    },
  }

  // console.log(httpOptions)
  return url.protocol === 'https:'
    ? https.request(httpOptions)
    : http.request(httpOptions)
}

module.exports = (url, filePath, proxy) => {
  return new Promise((resolve) => {
    sendRequest(url, proxy)
      .on('response', response => {
        // console.log(response.statusCode)
        if (response.statusCode !== 200 && response.statusCode != 206) {
          response.destroy(new Error('failed'))
          return
        }
        response
          .pipe(fs.createWriteStream(filePath))
          .on('finish', () => {
            // console.log('finish')
            if (response.complete) {
              // console.log('complete')
              // meta.APIC = picPath
              // handleWriteMeta(meta, filePath)
              resolve(true)
            } else {
              resolve(false)
              fs.unlink(filePath, err => {
                if (err) console.log(err.message)
              })
            }
          }).on('error', err => {
            // console.log('response error')
            if (err) console.log(err.message)
            fs.unlink(filePath, err => {
              if (err) console.log(err.message)
            })
            resolve(false)
          })
      })
      .on('error', err => {
        if (err) console.log(err.message)
        // delete meta.APIC
        // handleWriteMeta(meta, filePath)
        resolve(false)
      })
      .end()
  })
}

// const url = 'https://y.gtimg.cn/music/photo_new/T002R500x500M000000nfgwP0D6qxd.jpg'
// // const url = 'http://p4.music.126.net/-U2K8GKlASCSXK0cRre1gA==/109951163188718762.jpg'
// const picPath = require('path').join(__dirname, 'test.jpg')
// module.exports(url, picPath).then((sucee) => {
//   console.log(sucee)
// })
