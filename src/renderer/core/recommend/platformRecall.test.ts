import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MusicSdkResponseError } from '@renderer/utils/musicSdk/responseError'
import { recallPlatformSimilar } from './platformRecall'
import type { PlatformRecallAnchor } from './platformRecall'
import { SimilarCandidateCache } from './similarCache'

const mocks = vi.hoisted(() => ({
  wySearch: vi.fn(),
  txSearch: vi.fn(),
  wySimi: vi.fn(),
  txSimi: vi.fn(),
}))
vi.mock('@renderer/utils', () => ({
  toNewMusicInfo: (raw: any) => ({
    id: `${raw.source}_${raw.songmid}`,
    name: raw.name,
    singer: raw.singer,
    source: raw.source,
    interval: raw.interval,
    meta: { albumName: raw.albumName },
  }),
}))
vi.mock('@renderer/utils/musicSdk', () => ({
  default: {
    wy: { musicSearch: { search: mocks.wySearch }, simiSong: { getSimiSong: mocks.wySimi } },
    tx: { musicSearch: { search: mocks.txSearch }, simiSong: { getSimiSong: mocks.txSimi } },
  },
}))

const anchor: PlatformRecallAnchor = {
  artist: '周杰伦',
  title: '晴天',
  album: '叶惠美',
  intervalSec: 269,
  id: 'wy_186016',
  source: 'wy',
  seedIds: { wy: '186016' },
}

/** 搜索结果行（与 SDK 归一化同构）。 */
const searchRow = (over: Record<string, any> = {}) => ({
  singer: '周杰伦',
  name: '晴天',
  albumName: '叶惠美',
  interval: '04:29',
  songmid: '186016',
  songId: 97773,
  source: 'wy',
  ...over,
})
/** 相似结果行。 */
const simiRow = (name: string, singer: string, over: Record<string, any> = {}) => ({
  singer, name, albumName: 'Album', interval: '04:00', songmid: `id-${name}`, source: 'wy', ...over,
})

const searchResult = (rows: any[]) => ({ list: rows, allPage: 1, limit: 30, total: rows.length, source: 'wy' })
const simiResult = (rows: any[]) => ({ source: 'wy', list: rows })

/** 每次调用注入全新缓存（模块级单例会跨测试泄漏状态）。 */
const freshCache = () => new SimilarCandidateCache()
const call = async(anchorArg: PlatformRecallAnchor, options: Record<string, unknown> = {}) =>
  recallPlatformSimilar(anchorArg, { ...options, cache: freshCache() } as any)

beforeEach(() => {
  vi.clearAllMocks()
  // 默认：wy 原生种子直接可用（不走搜索）；tx 搜索可定位；两源默认空结果
  mocks.wySearch.mockResolvedValue(searchResult([searchRow()]))
  mocks.wySimi.mockResolvedValue(simiResult([]))
  mocks.txSearch.mockResolvedValue(searchResult([searchRow({ songmid: '0039MnYb0qxYhV', songId: 97773, source: 'tx' })]))
  mocks.txSimi.mockResolvedValue({ source: 'tx', list: [] })
})

describe('平台相似召回：种子定位', () => {
  it('全局屏蔽候选不占同艺人配额，缓存读取后仍执行当前规则', async() => {
    const cache = freshCache()
    mocks.wySimi.mockResolvedValue(simiResult(['a', 'b', 'c', 'd'].map(name => simiRow(name, 'Other Artist'))))
    await recallPlatformSimilar(anchor, { cache })
    const result = await recallPlatformSimilar(anchor, { cache, isExcluded: info => ['a', 'b'].includes(info.name) })
    expect(result.items.map(item => item.title)).toEqual(['c', 'd'])
    expect(mocks.wySimi).toHaveBeenCalledOnce()
    const blocked = await recallPlatformSimilar(anchor, { cache, isExcluded: () => true })
    expect(blocked.state).toBe('empty-after-filter')
    expect(blocked.items).toEqual([])
  })

  it('已消费的同艺人前两首不占用下一批配额', async() => {
    const cache = freshCache()
    mocks.wySimi.mockResolvedValue(simiResult(['a', 'b', 'c', 'd'].map(name => simiRow(name, 'Other Artist'))))
    const first = await recallPlatformSimilar(anchor, { cache })
    const second = await recallPlatformSimilar(anchor, { cache, excludeIds: first.items.map(item => item.musicInfo.id) })
    expect(first.items.map(item => item.title)).toEqual(['a', 'b'])
    expect(second.items.map(item => item.title)).toEqual(['c', 'd'])
    expect(mocks.wySimi).toHaveBeenCalledTimes(1)
    const exhausted = await recallPlatformSimilar(anchor, { cache, excludeIds: [...first.items, ...second.items].map(item => item.musicInfo.id) })
    expect(exhausted.state).toBe('exhausted')
  })

  it('收藏的同艺人前两首不阻断后续候选', async() => {
    mocks.wySimi.mockResolvedValue(simiResult(['a', 'b', 'c'].map(name => simiRow(name, 'Other Artist'))))
    const result = await call(anchor, { lovedTracks: ['a', 'b'].map(title => ({ artist: 'Other Artist', title })) })
    expect(result.items.map(item => item.title)).toEqual(['c'])
  })

  it('已匹配平台的空结果优先于另一平台无匹配', async() => {
    mocks.txSearch.mockResolvedValue(searchResult([]))
    const result = await call(anchor)
    expect(result.state).toBe('empty')
    expect(result.providers).toEqual(expect.arrayContaining([
      expect.objectContaining({ provider: 'wy', status: 'empty', seedId: '186016' }),
      expect.objectContaining({ provider: 'tx', status: 'no-match' }),
    ]))
  })

  it('原生平台标识直接使用，不发搜索请求', async() => {
    mocks.wySimi.mockResolvedValue(simiResult([simiRow('花海', '周杰伦')]))
    const result = await call(anchor)
    expect(mocks.wySearch).not.toHaveBeenCalled()
    expect(mocks.wySimi).toHaveBeenCalledWith('186016')
    expect(result.state).toBe('ok')
  })

  it('其他来源按歌手+歌名搜索后严格匹配；匹配失败跳过平台（no-match），不取第一条充数', async() => {
    const other: PlatformRecallAnchor = { artist: '周杰伦', title: '晴天', intervalSec: 269, id: 'kw_x', source: 'kw' }
    // 搜索返回的全部是翻唱/错版本
    const covers = searchResult([
      searchRow({ singer: 'Lucky小爱', name: '晴天(深情版)', source: 'tx', songmid: 't1', songId: 1 }),
      searchRow({ name: '晴天 (Live)', source: 'tx', songmid: 't2', songId: 2 }),
    ])
    mocks.wySearch.mockResolvedValue(covers)
    mocks.txSearch.mockResolvedValue(covers)
    const result = await call(other)
    expect(result.state).toBe('no-match')
    expect(mocks.txSimi).not.toHaveBeenCalled()
    expect(mocks.wySimi).not.toHaveBeenCalled()
  })

  it('起点歌手缺失（元数据不足）不算匹配证据', async() => {
    const other: PlatformRecallAnchor = { artist: '', title: '晴天', id: 'local_x', source: 'local' }
    const result = await call(other)
    expect(result.state).toBe('no-match')
  })
})

describe('平台相似召回：单源失败隔离与状态区分', () => {
  it('单源失败不丢其他源结果；状态 ok 且携带失败来源信息', async() => {
    mocks.wySimi.mockRejectedValue(new Error('wy down'))
    mocks.txSimi.mockResolvedValue({
      source: 'tx',
      list: [
        { singer: '林俊杰', name: '江南', albumName: '第二天堂', interval: '04:27', songmid: 'tx_jn', source: 'tx' },
      ],
    })
    const result = await call(anchor)
    expect(result.state).toBe('ok')
    expect(result.items.map(i => i.title)).toEqual(['江南'])
    const wy = result.providers.find(p => p.provider === 'wy')!
    expect(wy.status).toBe('error')
    expect(result.error).toContain('wy down')
  })

  it('全部平台失败为 all-failed（可重试语义），不是空结果', async() => {
    mocks.wySimi.mockRejectedValue(new Error('wy down'))
    mocks.txSearch.mockRejectedValue(new Error('tx search down'))
    const result = await call(anchor)
    expect(result.state).toBe('all-failed')
    expect(result.error).toContain('wy down')
  })

  it('相似调用失败单层重试一次，仍失败才报错', async() => {
    mocks.wySimi.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(simiResult([simiRow('花海', '周杰伦')]))
    const result = await call(anchor)
    expect(mocks.wySimi).toHaveBeenCalledTimes(2)
    expect(result.state).toBe('ok')
  })

  it('平台真实返回空列表为 empty 状态（不是失败）', async() => {
    const result = await call(anchor)
    expect(result.state).toBe('empty')
  })

  it('候选用尽（全部为会话已消费）为 exhausted，不是网络失败', async() => {
    mocks.wySimi.mockResolvedValue(simiResult([simiRow('花海', '周杰伦')]))
    const result = await call(anchor, {
      excludeTracks: [{ artist: '周杰伦', title: '花海' }],
    })
    expect(result.state).toBe('exhausted')
  })

  it('结果被非会话过滤（红心/队列/不再推荐）为 empty-after-filter', async() => {
    mocks.wySimi.mockResolvedValue(simiResult([simiRow('花海', '周杰伦')]))
    const result = await call(anchor, {
      lovedTracks: [{ artist: '周杰伦', title: '花海' }],
    })
    expect(result.state).toBe('empty-after-filter')
  })

  it('起点自身及同曲变体不入候选', async() => {
    mocks.wySimi.mockResolvedValue(simiResult([
      simiRow('晴天', '周杰伦', { songmid: '186016' }),
      simiRow('晴天 (Live)', '周杰伦'),
      simiRow('花海', '周杰伦'),
    ]))
    const result = await call(anchor)
    expect(result.items.map(i => i.title)).toEqual(['花海'])
  })

  it('当前队列同曲不重复插入', async() => {
    mocks.wySimi.mockResolvedValue(simiResult([simiRow('花海', '周杰伦')]))
    const result = await call(anchor, {
      queueTracks: [{ artist: '周杰伦', title: '花海' }],
    })
    expect(result.state).toBe('empty-after-filter')
  })

  it('「不再推荐」曲目被排除', async() => {
    mocks.wySimi.mockResolvedValue(simiResult([simiRow('花海', '周杰伦'), simiRow('七里香', '周杰伦')]))
    const result = await call(anchor, {
      dislikedTracks: [{ artist: '周杰伦', title: '花海' }],
    })
    expect(result.items.map(i => i.title)).toEqual(['七里香'])
  })

  it('取消状态不伪装成失败，也不写缓存', async() => {
    let cancelled = false
    mocks.wySimi.mockImplementation(async() => { cancelled = true; return simiResult([simiRow('花海', '周杰伦')]) })
    const cache = freshCache()
    const result = await recallPlatformSimilar(anchor, { isCancelled: () => cancelled, cache })
    expect(result.state).toBe('cancelled')
    expect(cache.size).toBe(0)
  })

  it('在途请求取消时调用适配器 cancel，不等待平台超时', async() => {
    let cancelled = false
    let cancelCalled = false
    mocks.wySimi.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/promise-function-async
      () => {
        const request = new Promise(() => {}) as Promise<unknown> & { cancel?: () => void }
        request.cancel = () => {
          cancelCalled = true
          cancelled = true
        }
        return request
      },
    )
    const pending = recallPlatformSimilar(anchor, { isCancelled: () => cancelled, cache: freshCache() })
    await new Promise(resolve => setTimeout(resolve, 80))
    cancelled = true
    const result = await pending
    expect(result.state).toBe('cancelled')
    expect(cancelCalled).toBe(true)
  })
})

describe('平台相似召回：跨源融合与缓存', () => {
  it('两源共同推荐保留双来源证据并融合排名', async() => {
    mocks.wySimi.mockResolvedValue(simiResult([
      simiRow('共同曲', '歌手A'),
      simiRow('仅网易', '歌手B'),
    ]))
    mocks.txSimi.mockResolvedValue({
      source: 'tx',
      list: [
        { singer: '歌手A', name: '共同曲', albumName: 'A', interval: '04:00', songmid: 'tx_same', source: 'tx' },
      ],
    })
    const result = await call(anchor)
    expect(result.state).toBe('ok')
    const both = result.items.find(i => i.title === '共同曲')!
    expect(both.sources.map(s => s.provider)).toEqual(['wy', 'tx'])
    expect(result.items[0].title).toBe('共同曲')
  })

  it('同种子第二次召回命中缓存，不再发相似请求', async() => {
    mocks.wySimi.mockResolvedValue(simiResult([simiRow('花海', '周杰伦')]))
    const cache = freshCache()
    await recallPlatformSimilar(anchor, { cache })
    await recallPlatformSimilar(anchor, { cache })
    expect(mocks.wySimi).toHaveBeenCalledTimes(1)
    const result = await recallPlatformSimilar(anchor, { cache })
    expect(result.providers.find(p => p.provider === 'wy')!.fromCache).toBe(true)
  })

  it('失败结果不写缓存：重试耗尽后失败，下一次重新请求', async() => {
    mocks.wySimi
      .mockRejectedValueOnce(new Error('down'))
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce(simiResult([simiRow('花海', '周杰伦')]))
    const cache = freshCache()
    const first = await recallPlatformSimilar(anchor, { cache })
    expect(first.state).toBe('empty') // wy 重试耗尽未取数 + tx 空结果 → empty（wy 未缓存）
    expect(mocks.wySimi).toHaveBeenCalledTimes(2)
    const second = await recallPlatformSimilar(anchor, { cache })
    expect(second.state).toBe('ok')
    expect(mocks.wySimi).toHaveBeenCalledTimes(3)
  })

  it('偏好变化后读缓存重新过滤（缓存不感知会话排除）', async() => {
    mocks.wySimi.mockResolvedValue(simiResult([simiRow('花海', '周杰伦'), simiRow('七里香', '周杰伦')]))
    const cache = freshCache()
    const first = await recallPlatformSimilar(anchor, { cache })
    expect(first.items).toHaveLength(2)
    const second = await recallPlatformSimilar(anchor, { cache, dislikedTracks: [{ artist: '周杰伦', title: '花海' }] })
    expect(second.items.map(i => i.title)).toEqual(['七里香'])
    expect(mocks.wySimi).toHaveBeenCalledTimes(1)
  })

  it('maxItems 截断入队数量', async() => {
    mocks.wySimi.mockResolvedValue(simiResult([
      simiRow('S1', 'A1'), simiRow('S2', 'A2'), simiRow('S3', 'A3'), simiRow('S4', 'A4'),
    ]))
    const result = await call(anchor, { maxItems: 2 })
    expect(result.items).toHaveLength(2)
    expect(result.state).toBe('ok')
  })
})

it(' 已缓存相似结果时，种子搜索故障不应丢失尚未消费的候选', async() => {
  const cache = freshCache()
  const localAnchor = { ...anchor, source: 'local', seedIds: null }
  mocks.wySimi.mockResolvedValue(simiResult([simiRow('第一首', 'ArtistA'), simiRow('第二首', 'ArtistB')]))
  const first = await recallPlatformSimilar(localAnchor, { cache, maxItems: 1 })
  expect(first.items).toHaveLength(1)
  expect(cache.size).toBe(2)
  mocks.wySearch.mockRejectedValue(new Error('search offline'))
  mocks.txSearch.mockRejectedValue(new Error('search offline'))
  const next = await recallPlatformSimilar(localAnchor, { cache, maxItems: 1, excludeIds: first.items.map(item => item.musicInfo.id) })
  expect(next.items.map(item => item.title)).toEqual(['第二首'])
})


it('缓存用尽不重搜，匹配证据变化或 TTL 到期后才重新定位', async() => {
  let now = 0
  const cache = new SimilarCandidateCache(64, 1000, () => now)
  const localAnchor = { ...anchor, source: 'local', seedIds: null }
  mocks.wySimi.mockResolvedValue(simiResult([simiRow('Song', 'Artist')]))
  const first = await recallPlatformSimilar(localAnchor, { cache })
  const excludeIds = first.items.map(item => item.musicInfo.id)
  const exhausted = await recallPlatformSimilar(localAnchor, { cache, excludeIds })
  expect(exhausted.state).toBe('exhausted')
  expect(mocks.wySearch).toHaveBeenCalledTimes(1)
  expect(mocks.txSearch).toHaveBeenCalledTimes(1)
  now = 1001
  await recallPlatformSimilar(localAnchor, { cache, excludeIds })
  expect(mocks.wySearch).toHaveBeenCalledTimes(2)
  await recallPlatformSimilar({ ...localAnchor, title: '另一录音' }, { cache })
  expect(mocks.wySearch).toHaveBeenCalledTimes(3)
})

describe('tx:seed-search 有限可取消重试、繁简统一与 YTM 原生 seedIds 直连', () => {
  it('tx 遇到业务拒绝（搜索失败）与连接重置（ECONNRESET）按预算重试最多 2 次并成功恢复', async() => {
    const resetErr = Object.assign(new Error('socket hang up'), { code: 'ECONNRESET', isReset: true })
    mocks.txSearch
      .mockRejectedValueOnce(new Error('搜索失败 (code=0/1000)'))
      .mockRejectedValueOnce(resetErr)
      .mockResolvedValueOnce(searchResult([searchRow({ songmid: '0039MnYb0qxYhV', songId: 97773, source: 'tx' })]))
    mocks.txSimi.mockResolvedValue({ source: 'tx', list: [simiRow('七里香', '周杰伦', { source: 'tx' })] })

    const res = await call({ ...anchor, seedIds: { wy: '186016' } }, { enabledProviders: ['tx'] })
    expect(mocks.txSearch).toHaveBeenCalledTimes(3)
    expect(res.state).toBe('ok')
    expect(res.items[0].title).toBe('七里香')
  })

  it('tx 超时、畸形响应（MusicSdkResponseError）与签名错误绝不重试', async() => {
    const timeoutErr = Object.assign(new Error('timeout'), { code: 'ETIMEDOUT', isTimeout: true })
    mocks.txSearch.mockRejectedValueOnce(timeoutErr)
    await call({ ...anchor, seedIds: null }, { enabledProviders: ['tx'] })
    expect(mocks.txSearch).toHaveBeenCalledTimes(1)

    vi.clearAllMocks()
    mocks.txSearch.mockRejectedValueOnce(new MusicSdkResponseError())
    await call({ ...anchor, seedIds: null }, { enabledProviders: ['tx'] })
    expect(mocks.txSearch).toHaveBeenCalledTimes(1)

    vi.clearAllMocks()
    mocks.txSearch.mockRejectedValueOnce(new Error('zzcSign invalid signature'))
    await call({ ...anchor, seedIds: null }, { enabledProviders: ['tx'] })
    expect(mocks.txSearch).toHaveBeenCalledTimes(1)
  })

  it('tx 种子搜索在退避期间被取消时立即中止，不再发出后续请求', async() => {
    let cancelled = false
    mocks.txSearch.mockImplementation(async() => {
      // 第 1 次失败后立即进入取消状态，退避期不应继续发出第 2 次请求
      setTimeout(() => { cancelled = true }, 20)
      throw new Error('搜索失败 (code=0/1000)')
    })

    const res = await call({ ...anchor, seedIds: null }, {
      enabledProviders: ['tx'],
      isCancelled: () => cancelled,
    })
    expect(res.state).toBe('cancelled')
    expect(mocks.txSearch).toHaveBeenCalledTimes(1)
  })

  it('tx 种子搜索在未启用 YTM 时共享同一截止时间，退避后若剩余预算低于门槛则不再发出重试', async() => {
    let clock = 1000
    mocks.txSearch.mockImplementationOnce(async() => {
      // 第 1 次尝试耗时 7.2s（10s 总预算剩 2.8s，扣 200ms 退避剩 2.6s >= 2.5s 允许进入退避）
      clock += 7_200
      // 模拟退避期间时钟又前进 200ms（实际到退避结束仅剩 2.4s < 2.5s），不得再发出第 2 次请求
      setTimeout(() => { clock += 400 }, 20)
      throw new Error('搜索失败 (code=0/1000)')
    })

    const res = await call({ ...anchor, seedIds: null }, {
      enabledProviders: ['tx'],
      now: () => clock,
    })
    expect(mocks.txSearch).toHaveBeenCalledTimes(1)
    expect(res.state).toBe('all-failed')
    expect(res.error).toContain('搜索失败')
  })

  it('繁体锚点在 locateSeed 中自动转简体定位国内种子', async() => {
    mocks.txSearch.mockResolvedValueOnce(searchResult([
      searchRow({ name: '爱在西元前', singer: '周杰伦', albumName: '范特西', interval: '03:54', songmid: 'tx_azxyq', songId: 8888, source: 'tx' }),
    ]))
    mocks.txSimi.mockResolvedValueOnce({ source: 'tx', list: [simiRow('简单爱', '周杰伦', { source: 'tx' })] })

    const res = await call({
      artist: '周杰倫',
      title: '愛在西元前',
      album: '范特西',
      intervalSec: 234,
      id: 'ytm_azxyq123456',
      source: 'ytm',
      seedIds: { ytm: 'azxyq123456' },
    }, { enabledProviders: ['tx'] })
    expect(mocks.txSearch).toHaveBeenCalledWith('爱在西元前 周杰伦', 1, 30)
    expect(res.state).toBe('ok')
    expect(res.items[0].title).toBe('简单爱')
  })

  it('YTM 锚点携带原生 seedIds.ytm 时直接进入 YTM Radio 召回，0 次 YTM 种子搜索', async() => {
    const ytmSearchSongs = vi.fn()
    const ytmGetRadio = vi.fn(async() => ({
      tracks: [{ videoId: 'recVid00001', title: '稻香', artist: '周杰伦', album: '魔杰座', intervalSec: 223, picUrl: null }],
      continuation: null,
      relatedBrowseId: null,
      hasValidContainer: true,
    }))
    mocks.wySearch.mockResolvedValueOnce(searchResult([
      searchRow({ name: '稻香', singer: '周杰伦', albumName: '魔杰座', interval: '03:43', songmid: 'dx', source: 'wy' }),
    ]))
    const ytmAnchor: PlatformRecallAnchor = {
      artist: '周杰伦',
      title: '晴天',
      album: '叶惠美',
      intervalSec: 269,
      id: 'ytm_nativeVid01',
      source: 'ytm',
      seedIds: { ytm: 'nativeVid01' },
    }

    const res = await call(ytmAnchor, {
      enabledProviders: ['ytm'],
      ytmAdapter: {
        searchSongs: ytmSearchSongs,
        getRadio: ytmGetRadio,
        getRelated: vi.fn(),
        checkRegionBlocked: vi.fn(async() => false),
      },
      ytmProxyContext: 'direct',
      playableTargets: ['wy'],
    })

    expect(ytmSearchSongs).not.toHaveBeenCalled()
    expect(ytmGetRadio).toHaveBeenCalledWith('nativeVid01', expect.any(Number))
    expect(res.state).toBe('ok')
    expect(res.items[0].title).toBe('稻香')
  })
})
