import { httpGet } from '../../request'

export const formatSinger = rawData => rawData.replace(/&/g, '、')

export const matchToken = headers => headers['set-cookie'][0].match(/kw_token=(\w+)/)[1]

export const getToken = () => new Promise((resolve, reject) => {
  httpGet('http://www.kuwo.cn', (err, resp) => {
    if (err) return reject(err)
    if (resp.statusCode != 200) return reject(new Error('获取失败'))
    const token = matchToken(resp.headers)
    resolve(token)
  })
})
