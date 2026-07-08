import http from 'node:http'
import https from 'node:https'
import crypto from 'node:crypto'
import querystring from 'node:querystring'
import type { Socket } from 'node:net'
import { getAddress } from '@common/utils/nodejs'
import { sendTaskbarButtonClick, sendSearchRequest, sendPlayRequest, sendQueueRequest } from '@main/modules/winMain'

const sendResponse = (res: http.ServerResponse, code = 200, msg: string | Record<any, unknown> = 'OK', contentType = 'text/plain; charset=utf-8') => {
  res.writeHead(code, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Connection': 'close',
  })
  if (typeof msg === 'object') {
    res.end(JSON.stringify(msg))
  } else {
    res.end(msg)
  }
}

/**
 * 解析 POST 请求体 (JSON)，自动检测编码
 */
const parseBody = (req: http.IncomingMessage): Promise<any> => new Promise((resolve, reject) => {
  const chunks: Buffer[] = []
  req.on('data', (chunk: Buffer) => chunks.push(chunk))
  req.on('end', () => {
    try {
      const buf = Buffer.concat(chunks)
      let raw = buf.toString('utf8')
      // UTF-8 解码出现替换字符 → 可能是 GBK 编码
      if (raw.includes('\ufffd')) {
        try {
          const iconv = require('iconv-lite')
          const gbkTry: string = iconv.decode(buf, 'gbk')
          if (!gbkTry.includes('\ufffd')) raw = gbkTry
        } catch (_) {}
      }
      resolve(raw ? JSON.parse(raw) : {})
    } catch (e) {
      reject(new Error('Invalid JSON body'))
    }
  })
  req.on('error', reject)
})

/**
 * HTTP GET 请求封装（用于搜索音乐源 API），带超时 + gzip解压
 */
const httpGet = (url: string, timeout = 10000): Promise<any> => {
  return doHttpGet(url, {}, timeout)
}
const httpGetWithHeaders = (url: string, extraHeaders: Record<string, string>, timeout = 10000): Promise<any> => {
  return doHttpGet(url, extraHeaders, timeout)
}
const doHttpGet = (url: string, extraHeaders: Record<string, string>, timeout: number): Promise<any> => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http
  const req = mod.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Encoding': 'gzip, deflate',
      ...extraHeaders,
    },
    timeout,
  }, (resp) => {
    const chunks: Buffer[] = []
    let stream: any = resp
    // 自动解压
    const ce = resp.headers['content-encoding']
    if (ce) {
      const zlib = require('zlib')
      if (ce.includes('gzip')) stream = resp.pipe(zlib.createGunzip())
      else if (ce.includes('deflate')) stream = resp.pipe(zlib.createInflate())
      else if (ce.includes('br')) stream = resp.pipe(zlib.createBrotliDecompress())
    }
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => {
      clearTimeout(timer)
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()))
      } catch (e) {
        resolve(Buffer.concat(chunks).toString())
      }
    })
    stream.on('error', (err: Error) => {
      clearTimeout(timer)
      reject(err)
    })
  })
  const timer = setTimeout(() => {
    req.destroy()
    reject(new Error('Request timeout'))
  }, timeout)
  req.on('error', (err) => {
    clearTimeout(timer)
    reject(err)
  })
})

/**
 * 搜索音乐 – 酷我 (kw)
 * 返回与 SDK toNewMusicInfo 兼容的完整 MusicInfo 格式
 */
const searchKw = async(keyword: string, page: number, limit: number) => {
  const url = `http://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(keyword)}&pn=${page - 1}&rn=${limit}&uid=794762570&ver=kwplayer_ar_9.2.2.1&vipver=1&show_copyright_off=1&newver=1&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&vermerge=1&mobi=1&issubtitle=1`
  const raw = await httpGet(url)
  if (!raw || !raw.abslist) return { list: [], total: 0, allPage: 1, limit, page }

  const mInfoRxp = /level:(\w+),bitrate:(\d+),format:(\w+),size:([\w.]+)/
  const list = raw.abslist.map((info: any) => {
    const songmid = info.MUSICRID ? info.MUSICRID.replace('MUSIC_', '') : ''
    const intervalNum = parseInt(info.DURATION) || 0
    const interval = intervalNum
      ? String(Math.floor(intervalNum / 60)).padStart(2, '0') + ':' + String(Math.floor(intervalNum % 60)).padStart(2, '0')
      : '00:00'

    // 解析 N_MINFO 获取音质信息
    const types: { type: string, size: string }[] = []
    const _types: Record<string, { size: string }> = {}
    if (info.N_MINFO) {
      for (const part of info.N_MINFO.split(';')) {
        const m = part.match(mInfoRxp)
        if (!m) continue
        let typeLabel: string
        switch (m[2]) {
          case '4000': typeLabel = 'flac24bit'; break
          case '2000': typeLabel = 'flac'; break
          case '320': typeLabel = '320k'; break
          case '128': typeLabel = '128k'; break
          default: continue
        }
        types.push({ type: typeLabel, size: m[4] })
        _types[typeLabel] = { size: m[4].toUpperCase() }
      }
    }
    types.reverse()

    return {
      id: `kw_${songmid}`,
      name: info.SONGNAME || '',
      singer: info.ARTIST || '',
      source: 'kw' as const,
      interval,
      meta: {
        songId: songmid,
        albumName: info.ALBUM || '',
        albumId: info.ALBUMID || '',
        qualitys: types,
        _qualitys: _types,
        picUrl: null,
        toggleMusicInfo: null,
      },
    }
  })
  const total = parseInt(raw.TOTAL) || list.length
  return { list, total, allPage: Math.max(1, Math.ceil(total / limit)), limit, page }
}

/**
 * 搜索音乐 – 酷狗 (kg)
 * 返回与 SDK toNewMusicInfo 兼容的完整 MusicInfo 格式
 */
const searchKg = async(keyword: string, page: number, limit: number) => {
  const url = `https://songsearch.kugou.com/song_search_v2?keyword=${encodeURIComponent(keyword)}&page=${page}&pagesize=${limit}&userid=0&clientver=&platform=WebFilter&filter=2&iscorrection=1&privilege_filter=0&area_code=1`
  const raw = await httpGet(url)
  if (!raw || raw.error_code !== 0 || !raw.data || !raw.data.lists) return { list: [], total: 0, allPage: 1, limit, page }

  const sizeFormate = (size: number) => {
    if (size < 1024) return size + 'B'
    if (size < 1048576) return (size / 1024).toFixed(1) + 'K'
    return (size / 1048576).toFixed(1) + 'M'
  }

  const filterItem = (item: any) => {
    const songmid = item.Audioid || ''
    const hash = item.FileHash || ''
    const intervalNum = item.Duration || 0
    const interval = intervalNum
      ? String(Math.floor(intervalNum / 60)).padStart(2, '0') + ':' + String(Math.floor(intervalNum % 60)).padStart(2, '0')
      : '00:00'

    // 解析音质
    const types: { type: string, size: string, hash: string }[] = []
    const _types: Record<string, { size: string, hash: string }> = {}
    if (item.FileSize !== 0) {
      const sz = sizeFormate(item.FileSize)
      types.push({ type: '128k', size: sz, hash: item.FileHash })
      _types['128k'] = { size: sz, hash: item.FileHash }
    }
    if (item.HQFileSize !== 0) {
      const sz = sizeFormate(item.HQFileSize)
      types.push({ type: '320k', size: sz, hash: item.HQFileHash })
      _types['320k'] = { size: sz, hash: item.HQFileHash }
    }
    if (item.SQFileSize !== 0) {
      const sz = sizeFormate(item.SQFileSize)
      types.push({ type: 'flac', size: sz, hash: item.SQFileHash })
      _types.flac = { size: sz, hash: item.SQFileHash }
    }
    if (item.ResFileSize !== 0) {
      const sz = sizeFormate(item.ResFileSize)
      types.push({ type: 'flac24bit', size: sz, hash: item.ResFileHash })
      _types.flac24bit = { size: sz, hash: item.ResFileHash }
    }

    const singer = item.Singers && item.Singers[0] ? item.Singers[0].name : ''

    return {
      id: `${songmid}_${hash}`,
      name: item.SongName || '',
      singer,
      source: 'kg' as const,
      interval,
      meta: {
        songId: songmid,
        albumName: item.AlbumName || '',
        albumId: item.AlbumID || '',
        qualitys: types,
        _qualitys: _types,
        hash,
        picUrl: null,
        toggleMusicInfo: null,
      },
    }
  }

  // 处理歌曲组 (Grp)
  const seen = new Set<string>()
  const list: any[] = []
  for (const item of raw.data.lists) {
    const key = item.Audioid + item.FileHash
    if (!seen.has(key)) {
      seen.add(key)
      list.push(filterItem(item))
    }
    if (item.Grp) {
      for (const child of item.Grp) {
        const cKey = child.Audioid + child.FileHash
        if (!seen.has(cKey)) {
          seen.add(cKey)
          list.push(filterItem(child))
        }
      }
    }
  }

  const total = raw.data.total || list.length
  return { list, total, allPage: Math.max(1, Math.ceil(total / limit)), limit, page }
}

/**
 * 搜索音乐 – 咪咕 (mg)
 * 返回与 SDK toNewMusicInfo 兼容的完整 MusicInfo 格式
 */
const searchMg = async(keyword: string, page: number, limit: number) => {
  const time = Date.now().toString()
  const deviceId = '963B7AA0D21511ED807EE5846EC87D20'
  const signatureMd5 = '6cdc72a439cef99a3418d2a78aa28c73'
  const sign = crypto.createHash('md5').update(`${keyword}${signatureMd5}yyapp2d16148780a1dcc7408e06336b98cfd50${deviceId}${time}`).digest('hex')
  const searchSwitch = '%7B%22song%22%3A1%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A1%2C%22mvSong%22%3A0%2C%22bestShow%22%3A1%2C%22songlist%22%3A0%2C%22lyricSong%22%3A0%7D'
  const url = `https://jadeite.migu.cn/music_search/v3/search/searchAll?isCorrect=0&isCopyright=1&searchSwitch=${searchSwitch}&pageSize=${limit}&text=${encodeURIComponent(keyword)}&pageNo=${page}&sort=0&sid=USS`
  
  const raw = await httpGetWithHeaders(url, {
    uiVersion: 'A_music_3.6.1',
    deviceId,
    timestamp: time,
    sign,
    channel: '0146921',
  })
  
  if (!raw || raw.code !== '000000') return { list: [], total: 0, allPage: 1, limit, page }
  const songResultData = raw.songResultData || { resultList: [], totalCount: 0 }
  
  const sizeFormate = (size: number) => {
    if (size < 1024) return size + 'B'
    if (size < 1048576) return (size / 1024).toFixed(1) + 'K'
    return (size / 1048576).toFixed(1) + 'M'
  }
  
  const seen = new Set<string>()
  const list: any[] = []
  for (const group of songResultData.resultList) {
    for (const item of group) {
      if (!item.songId || !item.copyrightId || seen.has(item.copyrightId)) continue
      seen.add(item.copyrightId)
      
      const types: { type: string, size: string }[] = []
      const _types: Record<string, { size: string }> = {}
      if (item.audioFormats) {
        for (const fmt of item.audioFormats) {
          const sz = sizeFormate(fmt.asize ?? fmt.isize ?? 0)
          switch (fmt.formatType) {
            case 'PQ': types.push({ type: '128k', size: sz }); _types['128k'] = { size: sz }; break
            case 'HQ': types.push({ type: '320k', size: sz }); _types['320k'] = { size: sz }; break
            case 'SQ': types.push({ type: 'flac', size: sz }); _types.flac = { size: sz }; break
            case 'ZQ24': types.push({ type: 'flac24bit', size: sz }); _types.flac24bit = { size: sz }; break
          }
        }
      }
      
      const singers = item.singerList?.map((s: any) => s.name).join('、') || item.singerName || ''
      const intervalNum = item.duration || 0
      const interval = intervalNum
        ? String(Math.floor(intervalNum / 60)).padStart(2, '0') + ':' + String(Math.floor(intervalNum % 60)).padStart(2, '0')
        : '00:00'
      
      list.push({
        id: `mg_${item.copyrightId}`,
        name: item.name || '',
        singer: singers,
        source: 'mg' as const,
        interval,
        meta: {
          songId: item.songId,
          copyrightId: item.copyrightId,
          albumName: item.album || '',
          albumId: item.albumId || '',
          qualitys: types,
          _qualitys: _types,
          picUrl: item.img3 || item.img2 || item.img1 || null,
          lrcUrl: item.lrcUrl || null,
          trcUrl: item.trcUrl || null,
          mrcUrl: item.mrcurl || null,
          toggleMusicInfo: null,
        },
      })
    }
  }
  const total = parseInt(songResultData.totalCount) || list.length
  return { list, total, allPage: Math.max(1, Math.ceil(total / limit)), limit, page }
}

/**
 * 搜索音乐 – QQ音乐 (tx)，通过 IPC 调用 renderer SDK
 */
const searchTx = async(keyword: string, page: number, limit: number) => {
  try {
    return await sendSearchRequest('tx', keyword, page, limit) as any
  } catch (e) {
    console.log('tx search error:', (e as Error).message)
    return { list: [], total: 0, allPage: 1, limit, page }
  }
}

/**
 * 搜索音乐 – 网易云 (wy)，通过 IPC 调用 renderer SDK
 */
const searchWy = async(keyword: string, page: number, limit: number) => {
  try {
    return await sendSearchRequest('wy', keyword, page, limit) as any
  } catch (e) {
    console.log('wy search error:', (e as Error).message)
    return { list: [], total: 0, allPage: 1, limit, page }
  }
}

/**
 * 音质权重映射
 */
const qualityScore: Record<string, number> = {
  flac24bit: 4,
  flac: 3,
  '320k': 2,
  '128k': 1,
}

/**
 * 获取歌曲的最高音质分
 */
const getBestQuality = (item: any): number => {
  const meta = item.meta || item
  if (!meta._qualitys) return 0
  let best = 0
  for (const q of Object.keys(meta._qualitys)) {
    best = Math.max(best, qualityScore[q] || 0)
  }
  return best
}

/**
 * 歌曲是否有指定最低音质
 */
const hasMinQuality = (item: any, minQ: string): boolean => {
  const score = qualityScore[minQ] || 0
  return getBestQuality(item) >= score
}

/**
 * 歌手匹配度
 */
const singerMatchScore = (itemSinger: string, targetSinger: string): number => {
  const clean = (s: string) => s.replace(/[\s、，,．·・'"/\\|&!！?？\-_+=\[\]【】()（）：:;；<>《》]/g, '').toLowerCase()
  const a = clean(itemSinger)
  const b = clean(targetSinger)
  if (!a || !b) return 0
  if (a === b) return 100
  if (a.includes(b) || b.includes(a)) return 50
  return 0
}

/**
 * 搜索音乐 – 综合搜索
 */
const searchMusic = async(keyword: string, source?: string, page = 1, limit = 20, dedup = false, matchSinger?: string, minQuality?: string, order?: string) => {
  if (source === 'kw') return searchKw(keyword, page, limit)
  if (source === 'kg') return searchKg(keyword, page, limit)
  if (source === 'mg') return searchMg(keyword, page, limit)
  if (source === 'tx') return searchTx(keyword, page, limit)
  if (source === 'wy') return searchWy(keyword, page, limit)
  
  // 默认源优先级（API 参数 > 设置页面 > 硬编码默认）
  const defaultOrder = ['kg', 'kw', 'mg', 'tx', 'wy']
  const settingOrder = global.lx.appSetting['openAPI.sourceOrder']
  const orderList = order
    ? order.split(',').filter(s => defaultOrder.includes(s))
    : settingOrder
      ? settingOrder.split(',').filter(s => defaultOrder.includes(s))
      : defaultOrder
  
  const sourceFns: Record<string, (kw: string, p: number, l: number) => Promise<any>> = {
    kw: searchKw, kg: searchKg, mg: searchMg, tx: searchTx, wy: searchWy,
  }
  
  // 按 order 指定的顺序搜索
  const tasks = orderList.map(s => sourceFns[s]?.(keyword, page, limit) ?? Promise.resolve({ list: [], total: 0, allPage: 1, limit, page }))
  const results = await Promise.allSettled(tasks)
  
  let list: any[] = []
  let total = 0
  let maxAllPage = 1
  for (const r of results) {
    if (r.status === 'fulfilled') {
      list.push(...r.value.list)
      total = Math.max(total, r.value.total)
      maxAllPage = Math.max(maxAllPage, r.value.allPage)
    }
  }

  // --- 后处理 ---

  // 1. 音质过滤
  if (minQuality) {
    list = list.filter(item => hasMinQuality(item, minQuality))
  }

  // 2. 歌手匹配排序
  if (matchSinger) {
    list.forEach(item => {
      (item as any)._matchLevel = singerMatchScore(item.singer, matchSinger) >= 100 ? 'exact'
        : singerMatchScore(item.singer, matchSinger) >= 50 ? 'partial'
        : 'none'
      ;(item as any)._matchScore = singerMatchScore(item.singer, matchSinger)
    })
    list.sort((a, b) => (b as any)._matchScore - (a as any)._matchScore)
  }

  // 3. 去重：同歌手+同歌名保留音质最佳
  if (dedup) {
    const cleanTitle = (s: string) => s.replace(/[\s、，,．·・'"/\\|&!！?？\-_+=\[\]【】()（）：:;；<>《》]/g, '').toLowerCase()
    const map = new Map<string, any>()
    for (const item of list) {
      const key = `${cleanTitle(item.singer)}|||${cleanTitle(item.name)}`
      const existing = map.get(key)
      if (!existing || getBestQuality(item) > getBestQuality(existing)) {
        map.set(key, item)
      }
    }
    list = [...map.values()]
  }

  return { list, total, allPage: maxAllPage, page, limit }
}

let status: LX.OpenAPI.Status = {
  status: false,
  message: '',
  address: '',
}

type SubscribeKeys = keyof LX.Player.Status

let httpServer: http.Server
let sockets = new Set<Socket>()
let responses = new Map<http.ServerResponse<http.IncomingMessage>, SubscribeKeys[]>()
let playerStatusKeys: SubscribeKeys[]

const defaultFilter = [
  'status',
  'name',
  'singer',
  'albumName',
  'lyricLineText',
  'duration',
  'progress',
  'playbackRate',
] satisfies SubscribeKeys[]

const parseFilter = (filter: any) => {
  if (typeof filter != 'string') return defaultFilter
  filter = filter.split(',')
  const subKeys = playerStatusKeys.filter(k => filter.includes(k))
  return subKeys.length ? subKeys : defaultFilter
}
const handleSendStatus = (res: http.ServerResponse<http.IncomingMessage>, query?: string) => {
  const keys = parseFilter(querystring.parse(query ?? '').filter)
  const resp: Partial<Record<SubscribeKeys, any>> = {}
  for (const k of keys) resp[k] = global.lx.player_status[k]
  sendResponse(res, 200, resp, 'application/json; charset=utf-8')
}
const handleSendAllLyric = (res: http.ServerResponse<http.IncomingMessage>) => {
  const resp: Partial<Record<SubscribeKeys, any>> = {
    lyric: global.lx.player_status.lyric,
    tlyric: global.lx.player_status.tlyric,
    rlyric: global.lx.player_status.rlyric,
    lxlyric: global.lx.player_status.lxlyric,
  }
  sendResponse(res, 200, resp, 'application/json; charset=utf-8')
}
const handleSubscribePlayerStatus = (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>, query?: string) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  })
  req.socket.setTimeout(0)
  req.on('close', () => {
    res.end('OK')
    responses.delete(res)
  })
  const keys = parseFilter(querystring.parse(query ?? '').filter)
  responses.set(res, keys)
  for (const [k, v] of Object.entries(global.lx.player_status)) {
    if (!keys.includes(k as SubscribeKeys)) continue
    res.write(`event: ${k}\n`)
    res.write(`data: ${JSON.stringify(v)}\n\n`)
  }
}

const handleStartServer = async(port: number, ip: string) => new Promise<void>((resolve, reject) => {
  playerStatusKeys = Object.keys(global.lx.player_status) as SubscribeKeys[]
  httpServer = http.createServer((req, res): void => {
    const [endUrl, query] = (req.url ?? '/').split('?')
    let code = 200
    let msg = 'OK'
    switch (endUrl) {
      case '/status':
        handleSendStatus(res, query)
        return
        // case '/test':
        //   code = 200
        //   res.setHeader('Content-Type', 'text/html; charset=utf-8')
        //   msg = `<!DOCTYPE html>
        //   <html lang="en">
        //     <head>
        //       <meta charset="UTF-8" />
        //       <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        //       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        //       <title>Nodejs Server-Sent Events</title>
        //     </head>
        //     <body>
        //       <h1>Hello SSE!</h1>

        //       <h2>List of Server-sent events</h2>
        //       <ul id="sse-list"></ul>

        //       <script>
        //         const subscription = new EventSource('/subscribe-player-status');

        //       // Default events
        //       subscription.addEventListener('open', () => {
        //           console.log('Connection opened')
        //       });

      //       subscription.addEventListener('error', (err) => {
      //           console.error(err)
      //       });
      //       subscription.addEventListener('lyricLineText', (event) => {
      //           console.log(event.data)
      //       });
      //       subscription.addEventListener('progress', (event) => {
      //           console.log(event.data)
      //       });
      //       subscription.addEventListener('name', (event) => {
      //           console.log(event.data)
      //       });
      //       subscription.addEventListener('singer', (event) => {
      //           console.log(event.data)
      //       });
      //       </script>
      //     </body>
      //   </html>`
      //   break
      case '/lyric':
        msg = global.lx.player_status.lyric
        break
      case '/lyric-all':
        handleSendAllLyric(res)
        return
      case '/play':
        sendTaskbarButtonClick('play')
        break
      case '/pause':
        sendTaskbarButtonClick('pause')
        break
      case '/skip-next':
        sendTaskbarButtonClick('next')
        break
      case '/skip-prev':
        sendTaskbarButtonClick('prev')
        break
      case '/seek': {
        const offset = parseFloat(querystring.parse(query ?? '').offset as string)
        if (Number.isNaN(offset) || offset < 0 || offset > global.lx.player_status.duration) {
          code = 400
          msg = 'Invalid offset'
        } else {
          sendTaskbarButtonClick('seek', parseFloat(offset.toFixed(3)))
        }
        break
      }
      case '/collect':
        sendTaskbarButtonClick('collect')
        break
      case '/uncollect':
        sendTaskbarButtonClick('unCollect')
        break
      case '/volume': {
        const volume = parseInt(querystring.parse(query ?? '').volume as string)
        if (Number.isNaN(volume) || volume < 0 || volume > 100) {
          code = 400
          msg = 'Invalid volume'
        } else {
          sendTaskbarButtonClick('volume', volume / 100)
        }
        break
      }
      case '/mute': {
        const mute = querystring.parse(query ?? '').mute
        if (mute == 'true') {
          sendTaskbarButtonClick('mute', true)
        } else if (mute == 'false') {
          sendTaskbarButtonClick('mute', false)
        } else {
          code = 400
          msg = 'Invalid mute value'
        }
        break
      }
      case '/subscribe-player-status':
        try {
          handleSubscribePlayerStatus(req, res, query)
          return
        } catch (err) {
          console.log(err)
          code = 500
          msg = 'Error'
        }
        break
      case '/search': {
        const params = querystring.parse(query ?? '')
        const keyword = params.keyword as string
        const source = params.source as string | undefined
        const page = parseInt(params.page as string) || 1
        const limit = parseInt(params.limit as string) || 20
        const dedup = params.dedup === 'true'
        const matchSinger = params.matchSinger as string | undefined
        const minQuality = params.minQuality as string | undefined
        const order = params.order as string | undefined
        if (!keyword) {
          sendResponse(res, 400, { error: true, message: 'Missing keyword' }, 'application/json; charset=utf-8')
          return
        }
        ;(async() => {
          try {
            const result = await searchMusic(keyword, source, page, limit, dedup, matchSinger, minQuality, order)
            sendResponse(res, 200, result, 'application/json; charset=utf-8')
          } catch (err: any) {
            console.log(err)
            sendResponse(res, 500, { error: true, message: err.message || 'Search failed' }, 'application/json; charset=utf-8')
          }
        })()
        return
      }
      case '/playlist/create': {
        if (req.method !== 'POST') {
          sendResponse(res, 405, { error: true, message: 'Method not allowed, use POST' }, 'application/json; charset=utf-8')
          return
        }
        ;(async() => {
          try {
            const body = await parseBody(req)
            const name = (body.name as string) || 'New List'
            const id = `userlist_${Date.now()}`
            await global.lx.event_list.list_create(-1, [{ id, name, locationUpdateTime: null }], false)
            sendResponse(res, 200, { id, name }, 'application/json; charset=utf-8')
          } catch (err: any) {
            console.log(err)
            sendResponse(res, 500, { error: true, message: err.message || 'Create failed' }, 'application/json; charset=utf-8')
          }
        })()
        return
      }
      case '/playlist/add': {
        if (req.method !== 'POST') {
          sendResponse(res, 405, { error: true, message: 'Method not allowed, use POST' }, 'application/json; charset=utf-8')
          return
        }
        ;(async() => {
          try {
            const body = await parseBody(req)
            const { listId, musicInfos } = body
            if (!listId) {
              sendResponse(res, 400, { error: true, message: 'Missing listId' }, 'application/json; charset=utf-8')
              return
            }
            if (!Array.isArray(musicInfos) || !musicInfos.length) {
              sendResponse(res, 400, { error: true, message: 'Missing musicInfos' }, 'application/json; charset=utf-8')
              return
            }
            await global.lx.event_list.list_music_add(listId, musicInfos, 'bottom', false)
            sendResponse(res, 200, { count: musicInfos.length }, 'application/json; charset=utf-8')
          } catch (err: any) {
            console.log(err)
            sendResponse(res, 500, { error: true, message: err.message || 'Add failed' }, 'application/json; charset=utf-8')
          }
        })()
        return
      }
      case '/playlist/remove': {
        if (req.method !== 'DELETE' && req.method !== 'POST') {
          sendResponse(res, 405, { error: true, message: 'Method not allowed' }, 'application/json; charset=utf-8')
          return
        }
        ;(async() => {
          try {
            const body = await parseBody(req)
            const ids = body.ids as string[]
            if (!Array.isArray(ids) || !ids.length) {
              sendResponse(res, 400, { error: true, message: 'Missing ids array' }, 'application/json; charset=utf-8')
              return
            }
            await global.lx.event_list.list_remove(ids, false)
            sendResponse(res, 200, { removed: ids.length }, 'application/json; charset=utf-8')
          } catch (err: any) {
            console.log(err)
            sendResponse(res, 500, { error: true, message: err.message || 'Remove failed' }, 'application/json; charset=utf-8')
          }
        })()
        return
      }
      case '/playlist/songs': {
        if (req.method !== 'DELETE' && req.method !== 'POST') {
          sendResponse(res, 405, { error: true, message: 'Method not allowed' }, 'application/json; charset=utf-8')
          return
        }
        ;(async() => {
          try {
            const body = await parseBody(req)
            const listId = body.listId as string
            const ids = body.ids as string[]
            if (!listId) {
              sendResponse(res, 400, { error: true, message: 'Missing listId' }, 'application/json; charset=utf-8')
              return
            }
            if (!Array.isArray(ids) || !ids.length) {
              sendResponse(res, 400, { error: true, message: 'Missing ids array' }, 'application/json; charset=utf-8')
              return
            }
            await global.lx.event_list.list_music_remove(listId, ids, false)
            sendResponse(res, 200, { removed: ids.length }, 'application/json; charset=utf-8')
          } catch (err: any) {
            console.log(err)
            sendResponse(res, 500, { error: true, message: err.message || 'Remove songs failed' }, 'application/json; charset=utf-8')
          }
        })()
        return
      }
      case '/playlist/list': {
        const params = querystring.parse(query ?? '')
        const listId = params.listId as string
        if (!listId) {
          sendResponse(res, 400, { error: true, message: 'Missing listId' }, 'application/json; charset=utf-8')
          return
        }
        ;(async() => {
          try {
            const songs = await global.lx.worker.dbService.getListMusics(listId) as any[]
            sendResponse(res, 200, { listId, songs }, 'application/json; charset=utf-8')
          } catch (err: any) {
            sendResponse(res, 500, { error: true, message: err.message || 'List failed' }, 'application/json; charset=utf-8')
          }
        })()
        return
      }
      case '/playlist/overwrite': {
        if (req.method !== 'POST') {
          sendResponse(res, 405, { error: true, message: 'Method not allowed, use POST' }, 'application/json; charset=utf-8')
          return
        }
        ;(async() => {
          try {
            const body = await parseBody(req)
            const listId = body.listId as string
            const musicInfos = body.musicInfos as any[]
            if (!listId) {
              sendResponse(res, 400, { error: true, message: 'Missing listId' }, 'application/json; charset=utf-8')
              return
            }
            if (!Array.isArray(musicInfos)) {
              sendResponse(res, 400, { error: true, message: 'Missing musicInfos array' }, 'application/json; charset=utf-8')
              return
            }
            await global.lx.event_list.list_music_overwrite(listId, musicInfos, false)
            sendResponse(res, 200, { count: musicInfos.length }, 'application/json; charset=utf-8')
          } catch (err: any) {
            console.log(err)
            sendResponse(res, 500, { error: true, message: err.message || 'Overwrite failed' }, 'application/json; charset=utf-8')
          }
        })()
        return
      }
      case '/player/play': {
        if (req.method !== 'POST') {
          sendResponse(res, 405, { error: true, message: 'Method not allowed, use POST' }, 'application/json; charset=utf-8')
          return
        }
        ;(async() => {
          try {
            const body = await parseBody(req)
            const { listId, musicInfo } = body
            if (!listId || !musicInfo) {
              sendResponse(res, 400, { error: true, message: 'Missing listId or musicInfo' }, 'application/json; charset=utf-8')
              return
            }
            await sendPlayRequest(listId, musicInfo)
            sendResponse(res, 200, { ok: true }, 'application/json; charset=utf-8')
          } catch (err: any) {
            sendResponse(res, 500, { error: true, message: err.message || 'Play failed' }, 'application/json; charset=utf-8')
          }
        })()
        return
      }
      case '/player/list': {
        ;(async() => {
          try {
            const result = await sendQueueRequest()
            sendResponse(res, 200, result, 'application/json; charset=utf-8')
          } catch (err: any) {
            sendResponse(res, 500, { error: true, message: err.message || 'Queue failed' }, 'application/json; charset=utf-8')
          }
        })()
        return
      }
      case '/playlists': {
        ;(async() => {
          try {
            const lists = await global.lx.worker.dbService.getAllUserList()
            sendResponse(res, 200, lists as any, 'application/json; charset=utf-8')
          } catch (err: any) {
            sendResponse(res, 500, { error: true, message: err.message || 'Failed' }, 'application/json; charset=utf-8')
          }
        })()
        return
      }
      default:
        code = 401
        msg = 'Forbidden'
        break
    }
    sendResponse(res, code, msg)
  })
  httpServer.on('error', error => {
    console.log(error)
    reject(error)
  })
  httpServer.on('connection', (socket) => {
    sockets.add(socket)
    socket.once('close', () => {
      sockets.delete(socket)
    })
    socket.setTimeout(4000)
  })

  httpServer.on('listening', () => {
    const addr = httpServer.address()
    // console.log(addr)
    if (!addr) {
      reject(new Error('address is null'))
      return
    }
    resolve()
  })
  httpServer.listen(port, ip)
})

const handleStopServer = async() => new Promise<void>((resolve, reject) => {
  if (!httpServer) return
  httpServer.close((err) => {
    if (err) {
      reject(err)
      return
    }
    resolve()
  })
  for (const socket of sockets) socket.destroy()
  sockets.clear()
  responses.clear()
})


const sendStatus = (status: Partial<LX.Player.Status>) => {
  if (!responses.size) return
  for (const [resp, keys] of responses) {
    for (const [k, v] of Object.entries(status)) {
      if (!keys.includes(k as SubscribeKeys)) continue
      resp.write(`event: ${k}\n`)
      resp.write(`data: ${JSON.stringify(v)}\n\n`)
    }
  }
}
export const stopServer = async() => {
  global.lx.event_app.off('player_status', sendStatus)
  if (!status.status) {
    status.status = false
    status.message = ''
    status.address = ''
    return status
  }
  await handleStopServer().then(() => {
    status.status = false
    status.message = ''
    status.address = ''
  }).catch(err => {
    console.log(err)
    status.message = err.message
  })
  return status
}
export const startServer = async(port: number, bindLan: boolean) => {
  if (status.status) await stopServer()
  await handleStartServer(port, bindLan ? '0.0.0.0' : '127.0.0.1').then(() => {
    status.status = true
    status.message = ''
    let address = ['127.0.0.1']
    if (bindLan) address = [...address, ...getAddress()]
    status.address = address.join(', ')
  }).catch(err => {
    console.log(err)
    status.status = false
    status.message = err.message
    status.address = ''
  })
  global.lx.event_app.on('player_status', sendStatus)
  return status
}

export const getStatus = (): LX.OpenAPI.Status => status
