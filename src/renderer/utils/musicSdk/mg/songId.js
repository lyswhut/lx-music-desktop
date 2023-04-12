import { httpFetch } from '../../request'

const getSongId = async(mInfo, retry = 0) => {
  if (mInfo.songmid != mInfo.copyrightId) return mInfo.songmid
  if (++retry > 2) return Promise.reject(new Error('max retry'))

  const requestObj = httpFetch(`https://app.c.nf.migu.cn/MIGUM2.0/v2.0/content/listen-url?netType=00&resourceType=2&songId=${mInfo.copyrightId}&toneFlag=PQ`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
      channel: '0146921',
    },
  })
  return requestObj.promise.then(({ body }) => {
    if (!body || body.code !== '000000') return getSongId(mInfo, retry)
    const id = body.data.songItem.songId
    if (!id) throw new Error('failed')
    return id
  })
}

export default getSongId

