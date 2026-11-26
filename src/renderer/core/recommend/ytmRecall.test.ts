/* eslint-disable @typescript-eslint/promise-function-async -- mock 适配器返回带 .cancel() 的同步包装 Promise */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { recallPlatformSimilar, type PlatformRecallAnchor } from './platformRecall'
import { SimilarCandidateCache } from './similarCache'
import type { YtmAdapter, YtmCancellablePromise } from './ytmAdapter'
import { YtmRegionBlockedError, type ParsedYtmRadioPage, type YtmRawTrack } from './ytmParser'

const mocks = vi.hoisted(() => {
  const makeThisBoundSearch = (source: string, impl: ReturnType<typeof vi.fn>) => {
    const obj = {
      source,
      limit: 30,
      search(this: any, str: string, page: number, limit: number) {
        if (this !== obj || this.limit !== 30) {
          throw new TypeError(`musicSearch.search(${source}) detached this receiver`)
        }
        return impl(str, page, limit)
      },
    }
    return obj
  }
  const wySearch = vi.fn()
  const txSearch = vi.fn()
  const kwSearch = vi.fn()
  const kgSearch = vi.fn()
  const mgSearch = vi.fn()
  return {
    wySearch,
    txSearch,
    kwSearch,
    kgSearch,
    mgSearch,
    wySimi: vi.fn(),
    txSimi: vi.fn(),
    wySearchObj: makeThisBoundSearch('wy', wySearch),
    txSearchObj: makeThisBoundSearch('tx', txSearch),
    kwSearchObj: makeThisBoundSearch('kw', kwSearch),
    kgSearchObj: makeThisBoundSearch('kg', kgSearch),
    mgSearchObj: makeThisBoundSearch('mg', mgSearch),
  }
})

vi.mock('@renderer/utils', () => ({
  toNewMusicInfo: (raw: any) => ({
    id: `${raw.source}_${raw.songmid}`,
    name: raw.name,
    singer: raw.singer,
    source: raw.source,
    interval: raw.interval ?? '04:00',
    meta: {
      songId: raw.songmid,
      albumName: raw.albumName ?? '',
      qualitys: raw.types ?? [],
      _qualitys: raw._types ?? {},
    },
  }),
}))

vi.mock('@renderer/utils/musicSdk', () => ({
  default: {
    wy: { musicSearch: mocks.wySearchObj, simiSong: { getSimiSong: mocks.wySimi } },
    tx: { musicSearch: mocks.txSearchObj, simiSong: { getSimiSong: mocks.txSimi } },
    kw: { musicSearch: mocks.kwSearchObj },
    kg: { musicSearch: mocks.kgSearchObj },
    mg: { musicSearch: mocks.mgSearchObj },
  },
}))

const anchor: PlatformRecallAnchor = {
  artist: '周杰伦',
  title: '晴天',
  album: '叶惠美',
  intervalSec: 269,
  id: 'wy_186016',
  source: 'wy',
  seedIds: { wy: '186016', tx: '97773' },
}

const cancellable = <T>(p: Promise<T>, onCancel?: () => void): YtmCancellablePromise<T> => {
  const cp = p as YtmCancellablePromise<T>
  cp.cancel = onCancel ?? (() => {})
  return cp
}

const rawTrack = (index: number, prefix = 'Track'): YtmRawTrack => ({
  videoId: `yt_${prefix}_${index}`,
  title: `${prefix}${index}`,
  artist: `Artist${index}`,
  album: `Album${index}`,
  intervalSec: 240,
  picUrl: null,
})

const createMockAdapter = (overrides: Partial<YtmAdapter> = {}): YtmAdapter => ({
  searchSongs: vi.fn(() => cancellable(Promise.resolve([{
    videoId: 'yt_seed_qingtian',
    title: '晴天',
    artist: '周杰倫',
    album: '葉惠美',
    intervalSec: 269,
    picUrl: null,
  }]))),
  getRadio: vi.fn(() => cancellable(Promise.resolve<ParsedYtmRadioPage>({
    tracks: [],
    continuation: null,
    relatedBrowseId: null,
    hasValidContainer: true,
  }))),
  getRadioContinuation: vi.fn(() => cancellable(Promise.resolve<ParsedYtmRadioPage>({
    tracks: [],
    continuation: null,
    relatedBrowseId: null,
    hasValidContainer: true,
  }))),
  getRelated: vi.fn(() => cancellable(Promise.resolve([]))),
  checkRegionBlocked: vi.fn(() => cancellable(Promise.resolve(false))),
  ...overrides,
})

afterEach(() => {
  vi.useRealTimers()
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.wySimi.mockResolvedValue({ list: [] })
  mocks.txSimi.mockResolvedValue({ list: [] })
  mocks.wySearch.mockImplementation(async(keyword: string) => {
    const [name, singer] = keyword.split(' ')
    return {
      list: [{
        source: 'wy',
        songmid: `m_${name}`,
        name,
        singer,
        albumName: 'Album',
        interval: '04:00',
      }],
    }
  })
  mocks.txSearch.mockResolvedValue({ list: [] })
  mocks.kwSearch.mockResolvedValue({ list: [] })
  mocks.kgSearch.mockResolvedValue({ list: [] })
  mocks.mgSearch.mockResolvedValue({ list: [] })
})

describe('YouTube Music 三方融合、整页尾部消费、安全续页与预算隔离', () => {
  it('三源共同推荐汇总 wy+tx+ytm 票数并排在首位，YTM 复用国内候选 0 额外桥接请求', async() => {
    mocks.wySimi.mockResolvedValue({
      list: [
        { source: 'wy', songmid: 'shared', name: '七里香', singer: '周杰伦', albumName: '七里香', interval: '04:59' },
        { source: 'wy', songmid: 'onlywy', name: '搁浅', singer: '周杰伦', albumName: '七里香', interval: '04:00' },
      ],
    })
    mocks.txSimi.mockResolvedValue({
      list: [
        { source: 'tx', songmid: 'tx_shared', name: '七里香', singer: '周杰伦', albumName: '七里香', interval: '04:59' },
      ],
    })
    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [{ videoId: 'yt_qlx', title: '七里香', artist: '周杰倫', album: '七里香', intervalSec: 299, picUrl: null }],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
    })

    const res = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy', 'tx', 'ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy', 'tx'],
    })

    expect(res.state).toBe('ok')
    expect(res.items[0].title).toBe('七里香')
    expect(res.items[0].sources.map(s => s.provider)).toEqual(['wy', 'tx', 'ytm'])
    // 七里香已与 wy 重叠，0 额外桥接搜索
    expect(mocks.wySearch).not.toHaveBeenCalled()
  })

  it('真实两页 YTM 续补：第 1 页 25 首整页缓存先消费尾部（13..25），耗尽后才拉第 2 页；第 2 页失败保留原 token 且不误报 exhausted', async() => {
    const page1 = Array.from({ length: 25 }, (_, i) => rawTrack(i + 1, 'P1'))
    const page2 = Array.from({ length: 10 }, (_, i) => rawTrack(i + 1, 'P2'))

    const getRadio = vi.fn(() => cancellable(Promise.resolve<ParsedYtmRadioPage>({
      tracks: page1,
      continuation: 'TOKEN_PAGE_2',
      relatedBrowseId: null,
      hasValidContainer: true,
    })))
    const getRadioContinuation = vi.fn()
      .mockImplementationOnce(() => cancellable(Promise.reject(new Error('HTTP 429'))))
      .mockImplementationOnce(() => cancellable(Promise.resolve<ParsedYtmRadioPage>({
        tracks: page2,
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      })))

    const adapter = createMockAdapter({ getRadio, getRadioContinuation })
    const cache = new SimilarCandidateCache()
    const baseOpts = {
      cache,
      enabledProviders: ['ytm'] as Array<'ytm'>,
      ytmAdapter: adapter,
      playableTargets: ['wy' as const],
      maxItems: 8,
    }

    // 第 1 批：取 1..8，未拉第 2 页
    const batch1 = await recallPlatformSimilar(anchor, baseOpts)
    expect(batch1.state).toBe('ok')
    expect(batch1.items.map(i => i.title)).toEqual(['P11', 'P12', 'P13', 'P14', 'P15', 'P16', 'P17', 'P18'])
    expect(getRadio).toHaveBeenCalledTimes(1)
    expect(getRadioContinuation).not.toHaveBeenCalled()

    // 第 2 批：消费第 1 页尾部 9..16，依然无需拉第 2 页！
    const consumed1 = batch1.items.map(i => ({ artist: i.artist, title: i.title }))
    const batch2 = await recallPlatformSimilar(anchor, { ...baseOpts, excludeTracks: consumed1 })
    expect(batch2.state).toBe('ok')
    expect(batch2.items.map(i => i.title)).toEqual(['P19', 'P110', 'P111', 'P112', 'P113', 'P114', 'P115', 'P116'])
    expect(getRadioContinuation).not.toHaveBeenCalled()

    // 第 3 批：消费第 1 页最后 17..25，仍不拉第 2 页（共 9 首 >= 8）
    const consumed2 = [...consumed1, ...batch2.items.map(i => ({ artist: i.artist, title: i.title }))]
    const batch3 = await recallPlatformSimilar(anchor, { ...baseOpts, excludeTracks: consumed2 })
    expect(batch3.state).toBe('ok')
    expect(batch3.items.map(i => i.title)).toEqual(['P117', 'P118', 'P119', 'P120', 'P121', 'P122', 'P123', 'P124'])
    expect(getRadioContinuation).not.toHaveBeenCalled()

    // 第 4 批：第 1 页全部 25 首均消费完 → 拉第 2 页遇到 429 瞬时失败 → 返回 all-failed（绝不误报 exhausted）且保留原 token！
    const allPage1 = page1.map(t => ({ artist: t.artist, title: t.title }))
    const batch4Fail = await recallPlatformSimilar(anchor, { ...baseOpts, excludeTracks: allPage1 })
    expect(batch4Fail.state).toBe('all-failed')
    expect(getRadioContinuation).toHaveBeenCalledTimes(1)
    expect(getRadioContinuation).toHaveBeenLastCalledWith('yt_seed_qingtian', 'TOKEN_PAGE_2', expect.any(Number))

    // 第 5 批：重试再次携带原 TOKEN_PAGE_2 成功拿到第 2 页曲目！
    const batch5Retry = await recallPlatformSimilar(anchor, { ...baseOpts, excludeTracks: allPage1 })
    expect(batch5Retry.state).toBe('ok')
    expect(batch5Retry.items[0].title).toBe('P21')
    expect(getRadioContinuation).toHaveBeenCalledTimes(2)
    expect(getRadioContinuation).toHaveBeenLastCalledWith('yt_seed_qingtian', 'TOKEN_PAGE_2', expect.any(Number))

    // 第 6 批：两页全部消费完且 continuation 为 null → 正确归类为 exhausted！
    const allTwoPages = [...allPage1, ...page2.map(t => ({ artist: t.artist, title: t.title }))]
    const batch6Exhausted = await recallPlatformSimilar(anchor, { ...baseOpts, excludeTracks: allTwoPages })
    expect(batch6Exhausted.state).toBe('exhausted')
  })

  it('地区受限按 proxyContext 隔离缓存：直连受限不阻断国内源，切换代理后立即恢复', async() => {
    mocks.wySimi.mockResolvedValue({
      list: [{ source: 'wy', songmid: 'w1', name: '江南', singer: '林俊杰', albumName: '第二天堂', interval: '04:27' }],
    })
    const cache = new SimilarCandidateCache()

    // 直连：YTM 搜索返回空 + 主页确认地区受限
    const blockedAdapter = createMockAdapter({
      searchSongs: vi.fn(() => cancellable(Promise.resolve([]))),
      checkRegionBlocked: vi.fn(() => cancellable(Promise.resolve(true))),
    })
    const directRes = await recallPlatformSimilar(anchor, {
      cache,
      enabledProviders: ['wy', 'ytm'],
      ytmAdapter: blockedAdapter,
      ytmProxyContext: 'direct',
      playableTargets: ['wy'],
    })
    expect(directRes.state).toBe('ok')
    expect(directRes.items.map(i => i.title)).toEqual(['江南'])
    expect(directRes.providers.find(p => p.provider === 'ytm')?.status).toBe('region-blocked')

    // 切换代理（proxyContext 变更）后缓存立即隔离，YTM 恢复命中！
    const proxiedAdapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [rawTrack(1, 'ProxySong')],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
    })
    const proxiedRes = await recallPlatformSimilar(anchor, {
      cache,
      enabledProviders: ['ytm'],
      ytmAdapter: proxiedAdapter,
      ytmProxyContext: 'dedicated:127.0.0.1:7890',
      playableTargets: ['wy'],
    })
    expect(proxiedRes.state).toBe('ok')
    expect(proxiedRes.items[0].title).toBe('ProxySong1')
    expect(proxiedRes.providers.find(p => p.provider === 'ytm')?.status).toBe('success')
  })

  it('冷门空曲不误判为 region-blocked', async() => {
    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
      checkRegionBlocked: vi.fn(() => cancellable(Promise.resolve(false))),
    })
    const res = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
    })
    expect(res.state).toBe('empty')
    expect(res.providers[0].status).toBe('empty')
  })

  it('无可用国内播放源（playableTargets=[]）诚实返回 no-playable-source，不作盲目回落', async() => {
    const adapter = createMockAdapter()
    const res = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
      playableTargets: [],
    })
    expect(res.state).toBe('no-playable-source')
    expect(res.providers[0].status).toBe('no-playable-source')
    expect(adapter.searchSongs).not.toHaveBeenCalled()
  })

  it('Bug #9 修复：池内绝大多数为会话已消费、仅偶发 1 首红心时优先归类 exhausted 而非 empty-after-filter', async() => {
    mocks.wySimi.mockResolvedValue({
      list: [
        { source: 'wy', songmid: 's1', name: 'Song1', singer: 'A1', interval: '04:00' },
        { source: 'wy', songmid: 's2', name: 'Song2', singer: 'A2', interval: '04:00' },
      ],
    })
    const res = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy'],
      excludeTracks: [{ artist: 'A1', title: 'Song1' }],
      lovedTracks: [{ artist: 'A2', title: 'Song2' }],
    })
    expect(res.state).toBe('exhausted')
  })

  it('R1 回归：省略 playableTargets 绝不默认启用全五源，诚实返回 no-playable-source 且 0 搜索', async() => {
    const adapter = createMockAdapter()
    const res = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
    })
    expect(res.state).toBe('no-playable-source')
    expect(adapter.searchSongs).not.toHaveBeenCalled()
    expect(mocks.wySearch).not.toHaveBeenCalled()
    expect(mocks.kwSearch).not.toHaveBeenCalled()
  })

  it('R1 回归：五源 this 绑定校验（含 kw/kg/mg）正常桥接 YTM 独有曲', async() => {
    mocks.mgSearch.mockImplementation(async(keyword: string) => {
      const [name, singer] = keyword.split(' ')
      return { list: [{ source: 'mg', songmid: `mg_${name}`, name, singer, albumName: 'Album1', interval: '04:00' }] }
    })
    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [rawTrack(1, 'OnlyYtm')],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
    })
    const res = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
      playableTargets: ['kw', 'kg', 'mg'],
    })
    expect(res.state).toBe('ok')
    expect(res.items[0].musicInfo.source).toBe('mg')
    expect(mocks.kwSearch).toHaveBeenCalled()
    expect(mocks.kgSearch).toHaveBeenCalled()
    expect(mocks.mgSearch).toHaveBeenCalled()
  })

  it('R1 回归：首屏重叠曲全部已收藏时 countUsableBridged 识别为 0 可用并自动消费 continuation 第 2 页', async() => {
    const page1 = Array.from({ length: 8 }, (_, i) => rawTrack(i + 1, 'Loved'))
    const page2 = [rawTrack(1, 'FreshP2')]
    mocks.wySimi.mockResolvedValue({
      list: page1.map(t => ({
        source: 'wy',
        songmid: t.videoId,
        name: t.title,
        singer: t.artist,
        albumName: t.album,
        interval: '04:00',
      })),
    })
    const getRadioContinuation = vi.fn(() => cancellable(Promise.resolve({
      tracks: page2,
      continuation: null,
      relatedBrowseId: null,
      hasValidContainer: true,
    })))
    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: page1,
        continuation: 'CONT_P2',
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
      getRadioContinuation,
    })

    const res = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy', 'ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
      lovedTracks: page1.map(t => ({ artist: t.artist, title: t.title })),
      maxItems: 8,
    })
    expect(getRadioContinuation).toHaveBeenCalledTimes(1)
    expect(res.state).toBe('ok')
    expect(res.items.map(i => i.title)).toEqual(['FreshP21'])
  })

  it('R1 回归：第 1 页重叠曲已消费完且第 2 页 continuation 429 失败时返回 all-failed 并保留 token（不误报 exhausted）', async() => {
    const p1 = rawTrack(1, 'Consumed')
    const p2 = rawTrack(1, 'RetryOk')
    mocks.wySimi.mockResolvedValue({
      list: [{ source: 'wy', songmid: 'c1', name: p1.title, singer: p1.artist, albumName: p1.album, interval: '04:00' }],
    })
    const getRadioContinuation = vi.fn()
      .mockImplementationOnce(() => cancellable(Promise.reject(new Error('HTTP 429'))))
      .mockImplementationOnce(() => cancellable(Promise.resolve({
        tracks: [p2],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      })))
    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [p1],
        continuation: 'TOKEN_KEEP',
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
      getRadioContinuation,
    })
    const cache = new SimilarCandidateCache()

    const first = await recallPlatformSimilar(anchor, {
      cache,
      enabledProviders: ['wy', 'ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
      excludeTracks: [{ artist: p1.artist, title: p1.title }],
    })
    expect(first.state).toBe('all-failed')
    expect(first.error).toContain('429')

    const retry = await recallPlatformSimilar(anchor, {
      cache,
      enabledProviders: ['wy', 'ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
      excludeTracks: [{ artist: p1.artist, title: p1.title }],
    })
    expect(retry.state).toBe('ok')
    expect(retry.items.map(i => i.title)).toEqual(['RetryOk1'])
    expect(getRadioContinuation).toHaveBeenLastCalledWith('yt_seed_qingtian', 'TOKEN_KEEP', expect.any(Number))
  })

  it('R1 回归：仅开 YTM 且国内桥接源全部断网抛错时返回 all-failed（不误报 empty）；InnerTube 封锁 HTML 返回 region-blocked', async() => {
    mocks.wySearch.mockRejectedValue(new Error('offline'))
    const offlineAdapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [rawTrack(1, 'OfflineTrack')],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
    })
    const offlineRes = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['ytm'],
      ytmAdapter: offlineAdapter,
      playableTargets: ['wy'],
    })
    expect(offlineRes.state).toBe('all-failed')
    expect(offlineRes.error).toContain('offline')

    const blockedAdapter = createMockAdapter({
      searchSongs: vi.fn(() => cancellable(Promise.reject(new YtmRegionBlockedError()))),
    })
    const blockedRes = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['ytm'],
      ytmAdapter: blockedAdapter,
      playableTargets: ['wy'],
    })
    expect(blockedRes.providers[0].status).toBe('region-blocked')
  })

  it('R1 回归：Radio 首屏仅种子且 Related 首次 503 失败时保留重试机会，二次召回重拉 Related 成功', async() => {
    const getRelated = vi.fn()
      .mockImplementationOnce(() => cancellable(Promise.reject(new Error('HTTP 503'))))
      .mockImplementationOnce(() => cancellable(Promise.resolve([rawTrack(1, 'RelRecovered')])))
    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [],
        continuation: null,
        relatedBrowseId: 'MPTRt_retry_1',
        hasValidContainer: true,
      }))),
      getRelated,
    })
    const cache = new SimilarCandidateCache()

    const first = await recallPlatformSimilar(anchor, {
      cache,
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
    })
    expect(first.state).toBe('all-failed')
    expect(getRelated).toHaveBeenCalledTimes(1)

    const second = await recallPlatformSimilar(anchor, {
      cache,
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
    })
    expect(second.state).toBe('ok')
    expect(second.items.map(i => i.title)).toEqual(['RelRecovered1'])
    expect(getRelated).toHaveBeenCalledTimes(2)
  })

  it('R1 回归：虚拟时钟下 QQ 连续挂起超时时，12s 内提交已就绪网易+YTM 批次且取消 QQ，不耗尽 YTM 桥接预算', async() => {
    vi.useFakeTimers()
    const txCancel = vi.fn()
    mocks.wySimi.mockResolvedValue({
      list: [{ source: 'wy', songmid: 'w1', name: '网易曲', singer: '歌手W', albumName: 'Album', interval: '04:00' }],
    })
    mocks.txSimi.mockImplementation(() => cancellable(new Promise(() => {}), txCancel))

    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [rawTrack(1, 'YtmFast')],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
    })

    let settled = false
    const pending = recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy', 'tx', 'ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
    }).then(res => { settled = true; return res })

    // 推进至 11.5 秒（严格早于 12s 预算截止）：单次 10s 超时后不再二次重试，已提交网易+YTM 结果！
    await vi.advanceTimersByTimeAsync(11_500)
    expect(settled).toBe(true)
    const res = await pending
    expect(res.state).toBe('ok')
    expect(res.items.map(i => i.title)).toEqual(expect.arrayContaining(['网易曲', 'YtmFast1']))
    expect(txCancel).toHaveBeenCalled()
    expect(res.providers.find(p => p.provider === 'tx')?.status).toBe('error')
    expect(res.providers.find(p => p.provider === 'ytm')?.status).toBe('success')
  })

  it('R1 回归：注入时钟下国内源迟于 12s 才完成时，早已就绪的 YTM Stage1 仍独立完成 Stage2 桥接', async() => {
    let fakeNow = 0
    let releaseWy!: (v: any) => void
    mocks.wySimi.mockImplementation(() => cancellable(new Promise(resolve => { releaseWy = resolve })))

    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [rawTrack(1, 'YtmIndependent')],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
    })

    const pending = recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy', 'ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
      now: () => fakeNow,
    })

    // YTM Stage1 + Stage2 在 t=1000ms 时立即完成，不被尚未返回的 wy 阻塞
    fakeNow = 1_000
    await vi.waitFor(() => { expect(mocks.wySearch).toHaveBeenCalledTimes(1) })

    // wy 迟至 t=15000ms 才返回（超过 12s 共享预算 → wy 判超时不混入，YTM 仍独立交付）
    fakeNow = 15_000
    releaseWy({ list: [{ source: 'wy', songmid: 'late1', name: '迟到曲', singer: '歌手L', albumName: 'Album', interval: '04:00' }] })
    const res = await pending
    expect(res.state).toBe('ok')
    expect(res.items.map(i => i.title)).toEqual(['YtmIndependent1'])
    expect(res.providers.find(p => p.provider === 'wy')?.status).toBe('error')
    expect(res.providers.find(p => p.provider === 'ytm')?.status).toBe('success')
  })

  it('R2/R3 回归：进入 withTimeout 即时取消伴随底层请求 reject 不触发 UnhandledPromiseRejection', async() => {
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => { unhandled.push(reason) }
    process.on('unhandledRejection', onUnhandled)
    try {
      let rejectReq!: (err: Error) => void
      let cancelled = false
      mocks.wySimi.mockImplementation(() => {
        // 在 getSimiSong 返回请求的同时触发取消，确保真正命中 withTimeout 即时取消分支并挂接 reject 处理
        cancelled = true
        return cancellable(new Promise((_resolve, reject) => { rejectReq = reject }))
      })
      const pending = recallPlatformSimilar(anchor, {
        cache: new SimilarCandidateCache(),
        enabledProviders: ['wy'],
        isCancelled: () => cancelled,
      })
      await vi.waitFor(() => { expect(mocks.wySimi).toHaveBeenCalledTimes(1) })
      rejectReq(new Error('aborted socket'))
      const res = await pending
      await new Promise(resolve => setTimeout(resolve, 25))
      expect(res.state).toBe('cancelled')
      expect(unhandled).toEqual([])
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }
  })

  it('R2 回归：500ms 预算死区 / 桥接部分断网 / Related 失败导致 0 可用时均返回 all-failed（不误报 exhausted）', async() => {
    const p1 = rawTrack(1, 'ConsumedTrack')
    mocks.wySimi.mockResolvedValue({
      list: [{ source: 'wy', songmid: 'c1', name: p1.title, singer: p1.artist, albumName: p1.album, interval: '04:00' }],
    })

    // 1) 预算落入 500ms 死区跳过 continuation 翻页
    let fakeNow = 0
    const deadZoneAdapter = createMockAdapter({
      getRadio: vi.fn(() => {
        fakeNow = 11_700 // 剩余 300ms <= 500ms 死区
        return cancellable(Promise.resolve({
          tracks: [p1],
          continuation: 'CONT_SKIPPED_BY_DEADZONE',
          relatedBrowseId: null,
          hasValidContainer: true,
        }))
      }),
    })
    const deadZoneRes = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy', 'ytm'],
      ytmAdapter: deadZoneAdapter,
      playableTargets: ['wy'],
      excludeTracks: [{ artist: p1.artist, title: p1.title }],
      now: () => fakeNow,
    })
    expect(deadZoneRes.state).toBe('all-failed')
    expect(deadZoneRes.providers.find(p => p.provider === 'ytm')?.status).toBe('error')

    // 2) 第 1 页有 1 首已消费重叠曲 + 其余独有曲全部桥接断网
    mocks.wySearch.mockRejectedValueOnce(new Error('bridge network down'))
    const bridgeErrAdapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [p1, rawTrack(2, 'NeedBridge')],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
    })
    const bridgeErrRes = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy', 'ytm'],
      ytmAdapter: bridgeErrAdapter,
      playableTargets: ['wy'],
      excludeTracks: [{ artist: p1.artist, title: p1.title }],
    })
    expect(bridgeErrRes.state).toBe('all-failed')
    expect(bridgeErrRes.error).toContain('bridge network down')

    // 3) 第 1 页仅 1 首已消费曲且 Related Tab 拉取失败
    const relErrAdapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [p1],
        continuation: null,
        relatedBrowseId: 'MPTRt_err_1',
        hasValidContainer: true,
      }))),
      getRelated: vi.fn(() => cancellable(Promise.reject(new Error('related 503')))),
    })
    const relErrRes = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy', 'ytm'],
      ytmAdapter: relErrAdapter,
      playableTargets: ['wy'],
      excludeTracks: [{ artist: p1.artist, title: p1.title }],
    })
    expect(relErrRes.state).toBe('all-failed')
    expect(relErrRes.error).toContain('related 503')
  })

  it('R2 回归：第 2 页 continuation 遇 YtmRegionBlockedError 时保留第 1 页已桥接可用候选，不整批丢弃', async() => {
    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [rawTrack(1, 'PageOneOk')],
        continuation: 'CONT_BLOCKED',
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
      getRadioContinuation: vi.fn(() => cancellable(Promise.reject(new YtmRegionBlockedError()))),
    })
    const cache = new SimilarCandidateCache()
    const res = await recallPlatformSimilar(anchor, {
      cache,
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
      maxItems: 8,
    })
    expect(res.state).toBe('ok')
    expect(res.items.map(i => i.title)).toEqual(['PageOneOk1'])
    expect(res.providers[0].status).toBe('success')
    expect(cache.getRegionStatus('direct')).toBe(true)
  })

  it('R2 回归：国内源晚于 YTM Stage2 收敛时零网络补对账匹配并累加双源 RRF 票', async() => {
    const sharedTrack = rawTrack(1, 'LateOverlap')
    // Stage 2 搜索期间 wySearch 返回空，模拟只能靠 wy 相似列表重叠命中的场景
    mocks.wySearch.mockResolvedValue({ list: [] })
    let releaseWy!: (v: any) => void
    mocks.wySimi.mockImplementation(() => cancellable(new Promise(resolve => { releaseWy = resolve })))

    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [sharedTrack],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
    })

    const pending = recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy', 'ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
    })

    // 等待 YTM Stage2 先完成（此时 wySearch 已调用 1 次且未命中）
    await vi.waitFor(() => { expect(mocks.wySearch).toHaveBeenCalledTimes(1) })
    await new Promise(resolve => setTimeout(resolve, 20))

    // 之后慢 wy 相似结果才到达
    releaseWy({
      list: [{
        source: 'wy',
        songmid: 'wy_late_shared',
        name: sharedTrack.title,
        singer: sharedTrack.artist,
        albumName: sharedTrack.album,
        interval: '04:00',
      }],
    })
    const res = await pending
    expect(res.state).toBe('ok')
    expect(res.items).toHaveLength(1)
    expect(res.items[0].sources.map(s => s.provider)).toEqual(['wy', 'ytm'])
    // 零额外网络搜索
    expect(mocks.wySearch).toHaveBeenCalledTimes(1)
  })

  it('R3 回归：第 1 页重叠曲经融合过滤被 tx 备用排除且 continuation 失败时仍返回 all-failed（不误报 exhausted）', async() => {
    const track = rawTrack(1, 'OverlapExcluded')
    mocks.wySimi.mockResolvedValue({
      list: [{ source: 'wy', songmid: 'wy_ov1', name: track.title, singer: track.artist, albumName: track.album, interval: '04:00' }],
    })
    mocks.txSimi.mockResolvedValue({
      list: [{ source: 'tx', songmid: 'tx_ov1', name: track.title, singer: track.artist, albumName: track.album, interval: '04:00' }],
    })
    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [track],
        continuation: 'CONT_FAIL',
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
      getRadioContinuation: vi.fn(() => cancellable(Promise.reject(new Error('HTTP 503')))),
    })
    const res = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy', 'tx', 'ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
      // 仅排除 tx ID，Stage2 countUsableBridged(wy_ov1) > 0，但融合后 filterFused 淘汰该候选导致最终 0 项
      excludeIds: ['tx_tx_ov1'],
    })
    expect(res.state).toBe('all-failed')
    expect(res.error).toContain('503')
  })

  it('R3 回归：continuation 遇 region-blocked 但收敛后零网络对账命中慢国内源时，仍晋升为成功并保留 YTM 票', async() => {
    const sharedTrack = rawTrack(1, 'RescuedByLateWy')
    mocks.wySearch.mockResolvedValue({ list: [] })
    let releaseWy!: (v: any) => void
    mocks.wySimi.mockImplementation(() => cancellable(new Promise(resolve => { releaseWy = resolve })))

    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [sharedTrack],
        continuation: 'CONT_GEO',
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
      getRadioContinuation: vi.fn(() => cancellable(Promise.reject(new YtmRegionBlockedError()))),
    })
    const pending = recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['wy', 'ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
    })
    await vi.waitFor(() => { expect(mocks.wySearch).toHaveBeenCalledTimes(1) })
    await new Promise(resolve => setTimeout(resolve, 20))
    releaseWy({
      list: [{
        source: 'wy',
        songmid: 'wy_geo_rescue',
        name: sharedTrack.title,
        singer: sharedTrack.artist,
        albumName: sharedTrack.album,
        interval: '04:00',
      }],
    })
    const res = await pending
    expect(res.state).toBe('ok')
    expect(res.items[0].sources.map(s => s.provider)).toEqual(['wy', 'ytm'])
    expect(res.providers.find(p => p.provider === 'ytm')?.status).toBe('success')
  })

  it('R3 回归：酷我搜索 503 返回 { list: [], total: NaN } 时按异常拒写负缓存，恢复后立即可桥接', async() => {
    const track = rawTrack(1, 'KwRecover')
    mocks.kwSearch
      .mockResolvedValueOnce({ list: [], total: Number.NaN, allPage: Number.NaN, source: 'kw' })
      .mockResolvedValueOnce({
        list: [{ source: 'kw', songmid: 'kw_rec_1', name: track.title, singer: track.artist, albumName: track.album, interval: '04:00' }],
        total: 1,
        allPage: 1,
        source: 'kw',
      })
    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [track],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
    })
    const cache = new SimilarCandidateCache()
    const first = await recallPlatformSimilar(anchor, {
      cache,
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
      playableTargets: ['kw'],
    })
    expect(first.state).toBe('all-failed')
    expect(cache.getBridge(track.videoId, 'kw').hit).toBe(false)

    const second = await recallPlatformSimilar(anchor, {
      cache,
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
      playableTargets: ['kw'],
    })
    expect(second.state).toBe('ok')
    expect(second.items[0].musicInfo.source).toBe('kw')
  })

  it('YouTube Music 平权直播：启用 allowDirectYtmPlayback 后即使无国内可播源或国内未命中也可直接返回原生 ytm 可播曲目', async() => {
    const exclusiveTrack = rawTrack(1, 'YtmOnlyExclusive')
    const adapter = createMockAdapter({
      getRadio: vi.fn(() => cancellable(Promise.resolve({
        tracks: [exclusiveTrack],
        continuation: null,
        relatedBrowseId: null,
        hasValidContainer: true,
      }))),
    })

    // 场景 A：无任何国内自定义源（playableTargets=[]）→ 仍直接返回 source='ytm' 原生可播曲目
    const noDomesticRes = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
      playableTargets: [],
      allowDirectYtmPlayback: true,
    })
    expect(noDomesticRes.state).toBe('ok')
    expect(noDomesticRes.items).toHaveLength(1)
    expect(noDomesticRes.items[0].musicInfo.source).toBe('ytm')
    expect(noDomesticRes.items[0].musicInfo.id).toBe(`ytm_${exclusiveTrack.videoId}`)
    expect((noDomesticRes.items[0].musicInfo as LX.Music.MusicInfoOnline).meta._qualitys).toMatchObject({ '128k': { size: null }, '320k': { size: null } })

    // 场景 B：有国内源但国内搜索 0 命中 → 平滑保留原生 ytm 曲目直接进探索队列
    mocks.wySearch.mockResolvedValue({ list: [] })
    const unmatchedDomesticRes = await recallPlatformSimilar(anchor, {
      cache: new SimilarCandidateCache(),
      enabledProviders: ['ytm'],
      ytmAdapter: adapter,
      playableTargets: ['wy'],
      allowDirectYtmPlayback: true,
    })
    expect(unmatchedDomesticRes.state).toBe('ok')
    expect(unmatchedDomesticRes.items[0].musicInfo.source).toBe('ytm')
  })
})
