import { httpFetch } from '../../request'
import { decodeKrc } from '@common/utils/lyricUtils/kg'
import { toMD5 } from '../utils'

// 酷狗歌词接口多 host 回退顺序
const KG_LYRIC_HOSTS = ['lyrics2.kugou.com', 'lyrics.kugou.com', 'krcsretry.kugou.com']
const KG_SIGN_SECRET = 'OIlwieks28dk2k092lksi2UIkp'

/**
 * 歌词接口签名：参数按 key 排序后拼成 k=v，前后裹密钥做 MD5。
 * 直接用 toMD5（而非 signatureParams），避免 keyword 含 & / = 时 split 出错。
 */
const kgLyricSign = (params, body = '') => {
  const joined = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('')
  return toMD5(`${KG_SIGN_SECRET}${joined}${body}${KG_SIGN_SECRET}`)
}

const buildLyricHeaders = () => ({
  clienttime: Math.floor(Date.now() / 1000).toString(),
  mid: '-',
  dfid: '-',
})

const buildQuery = params => Object.keys(params)
  .map(k => `${k}=${encodeURIComponent(params[k])}`)
  .join('&')

export default {
  getIntv(interval) {
    if (!interval) return 0
    let intvArr = interval.split(':')
    let intv = 0
    let unit = 1
    while (intvArr.length) {
      intv += (intvArr.pop()) * unit
      unit *= 60
    }
    return parseInt(intv)
  },

  // 单次 GET 请求，挂到 controller.current 以支持取消。返回已解析的 body。
  _request(controller, url) {
    if (controller.cancelled) return Promise.reject(new Error('cancelled'))
    const requestObj = httpFetch(url, { headers: buildLyricHeaders() })
    controller.current = requestObj
    return requestObj.promise.then(({ body, statusCode }) => {
      if (statusCode !== 200) throw new Error(`HTTP ${statusCode}`)
      return body
    })
  },

  /**
   * 搜索歌词候选（v1 签名接口，多 host 回退）。
   * 成功返回最匹配的候选 { accessKey, downloadId, contenttype }，无结果返回 null。
   */
  async searchLyric(controller, keyword, duration, hash, audioId) {
    const params = {
      album_audio_id: audioId ? String(audioId) : '0',
      appid: '1005',
      clientver: '20669',
      duration: String(duration),
      keyword,
      lrctxt: '1',
      man: 'no',
      query_copyright: '1',
      vocab: '0',
    }
    if (hash) params.hash = String(hash).toLowerCase()
    const signature = kgLyricSign(params)
    const query = buildQuery(params)

    for (const host of KG_LYRIC_HOSTS) {
      if (controller.cancelled) throw new Error('cancelled')
      let body
      try {
        body = await this._request(controller, `https://${host}/v1/search?${query}&signature=${signature}`)
      } catch {
        continue
      }
      if (!body || body.status != 200 || body.error_code == 20006) continue
      const candidates = body.candidates
      if (!candidates || !candidates.length) return null
      return this._selectCandidate(candidates, duration)
    }
    return null
  },

  /**
   * 从候选里挑最匹配的一条。酷狗会返回同名歌的多个版本（现场/remix/不同母带），
   * candidates[0] 按相关度排序但时长未必最接近——时间轴对齐依赖时长精确匹配，
   * 故优先选 duration 最接近目标的候选。
   * 注意：lx 传入的目标 duration 只有秒级精度（songInfo.interval/_interval 为秒），
   * 候选 duration 是真实毫秒，故先按秒级差比较，秒差相同再比毫秒差，仍相同取 score 高者。
   */
  _selectCandidate(candidates, duration) {
    const valid = []
    for (const info of candidates) {
      const downloadId = info.id ?? info.download_id
      if (info.accesskey == null || downloadId == null) continue
      valid.push({
        accessKey: info.accesskey,
        downloadId: String(downloadId),
        contenttype: info.contenttype ?? 0,
        duration: Number(info.duration) || 0,
        score: Number(info.score) || 0,
      })
    }
    if (!valid.length) return null
    // duration 未知时退回第一个（已按相关度排序）
    if (!duration) return valid[0]
    const targetSec = Math.round(duration / 1000)
    let best = valid[0]
    let bestSecDiff = Math.abs(Math.round(best.duration / 1000) - targetSec)
    let bestMsDiff = Math.abs(best.duration - duration)
    for (let i = 1; i < valid.length; i++) {
      const cur = valid[i]
      const secDiff = Math.abs(Math.round(cur.duration / 1000) - targetSec)
      const msDiff = Math.abs(cur.duration - duration)
      if (
        secDiff < bestSecDiff ||
        (secDiff === bestSecDiff && msDiff < bestMsDiff) ||
        (secDiff === bestSecDiff && msDiff === bestMsDiff && cur.score > best.score)
      ) {
        best = cur
        bestSecDiff = secDiff
        bestMsDiff = msDiff
      }
    }
    return best
  },

  /**
   * 下载并解析歌词（v2 签名接口，多 host 回退）。
   * 成功返回 { lyric, tlyric, rlyric, lxlyric }，失败返回 null。
   */
  async downloadLyric(controller, accessKey, downloadId, contenttype) {
    const params = {
      accesskey: accessKey,
      appid: '1005',
      clientver: '20669',
      contenttype: String(contenttype),
      download_id: downloadId,
    }
    const signature = kgLyricSign(params)
    const query = buildQuery(params)

    for (const host of KG_LYRIC_HOSTS) {
      if (controller.cancelled) throw new Error('cancelled')
      let body
      try {
        body = await this._request(controller, `https://${host}/v2/download?${query}&signature=${signature}`)
      } catch {
        continue
      }
      if (!body || body.status != 1 || body.error_code == 20006) continue
      const content = body.data?.content ?? body.content
      if (!content) continue
      return this.parseLyric(content)
    }
    return null
  },

  // 优先按 KRC（加密）解析，失败则回退按纯文本 LRC（base64）处理。
  async parseLyric(content) {
    try {
      return await decodeKrc(content)
    } catch {
      return {
        lyric: Buffer.from(content, 'base64').toString('utf-8'),
        tlyric: '',
        rlyric: '',
        lxlyric: '',
        plyric: '',
      }
    }
  },

  getLyric(songInfo) {
    const controller = { current: null, cancelled: false }
    const cancelHttp = () => {
      controller.cancelled = true
      if (controller.current) {
        try {
          controller.current.cancelHttp()
        } catch {}
      }
    }

    const keyword = songInfo.singer ? `${songInfo.singer} - ${songInfo.name}` : songInfo.name
    // 搜索接口 duration 用毫秒；songInfo._interval / interval 为秒。
    const duration = (songInfo._interval || this.getIntv(songInfo.interval)) * 1000

    const promise = (async() => {
      const result = await this.searchLyric(controller, keyword, duration, songInfo.hash, songInfo.songmid)
      if (!result) throw new Error('Get lyric failed')
      const lyric = await this.downloadLyric(controller, result.accessKey, result.downloadId, result.contenttype)
      if (!lyric) throw new Error('Get lyric failed')
      return lyric
    })()

    return { promise, cancelHttp }
  },
}
