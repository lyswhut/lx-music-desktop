import { describe, expect, it, vi } from 'vitest'
import { SimilarCandidateCache } from './similarCache'
import { bridgeYtmTracks, type DomesticBridgeProvider } from './ytmBridge'
import type { RankedYtmTrack } from './ytmParser'

const makeOnlineInfo = (
  source: DomesticBridgeProvider,
  id: string,
  name: string,
  singer: string,
  interval = '04:00',
  albumName = 'Album',
): LX.Music.MusicInfoOnline => ({
  id: `${source}_${id}`,
  name,
  singer,
  source,
  interval,
  meta: { songId: id, albumName, qualitys: [], _qualitys: {} },
}) as unknown as LX.Music.MusicInfoOnline

const makeRanked = (videoId: string, title: string, artist: string, rank: number, intervalSec: number | null = 240, album = 'Album'): RankedYtmTrack => ({
  rank,
  track: { videoId, title, artist, album, intervalSec, picUrl: null },
})

describe('ytmBridge：严格同录音重叠复用、按源独立缓存、并发上限与预算中止', () => {
  it('与既有国内候选严格重叠时 0 额外请求复用，并拒绝仅共享合作者的不同录音（A、C 180s vs B、C 230s）', async() => {
    const cache = new SimilarCandidateCache()
    const searchDomestic = vi.fn().mockResolvedValue([])
    const existingDomestic = [
      makeOnlineInfo('wy', '1', '晴天', '周杰伦', '04:29', '叶惠美'),
      makeOnlineInfo('wy', '2', '同名曲', '主唱B、合作者C', '03:50', 'Other'),
    ]

    const result = await bridgeYtmTracks(
      [
        makeRanked('v1', '晴天', '周杰倫', 1, 269, '葉惠美'), // 繁体严格匹配 → 0 请求复用
        makeRanked('v2', '同名曲', '主唱A、合作者C', 2, 180, 'AlbumA'), // 主艺人不同+时长差 50s → 拒绝误复用
      ],
      {
        anchor: { artist: '林俊杰', title: '江南' },
        existingDomestic,
        playableTargets: ['wy'],
        searchDomestic,
        cache,
        targetCount: 5,
        deadlineAt: Date.now() + 10_000,
      },
    )

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ rank: 1, musicInfo: { id: 'wy_1' } })
    // v1 未发搜索，仅 v2 触发 1 次国内搜索
    expect(searchDomestic).toHaveBeenCalledTimes(1)
    expect(searchDomestic.mock.calls[0][1]).toContain('同名曲')
  })

  it('按 (videoId, domesticProvider) 独立缓存：单源无匹配不遮蔽切换后的另一国内可播源', async() => {
    const cache = new SimilarCandidateCache()
    const searchDomestic = vi.fn(async(provider: DomesticBridgeProvider) => {
      if (provider === 'wy') return []
      if (provider === 'tx') return [makeOnlineInfo('tx', '77', '七里香', '周杰伦', '04:59', '七里香')]
      return []
    })

    // 第一轮仅 wy 可播：查 wy 写 (v1, wy) = null 负缓存
    const first = await bridgeYtmTracks([makeRanked('v1', '七里香', '周杰倫', 1, 299, '七里香')], {
      anchor: { artist: '陈奕迅', title: '十年' },
      existingDomestic: [],
      playableTargets: ['wy'],
      searchDomestic,
      cache,
      targetCount: 5,
      deadlineAt: Date.now() + 10_000,
    })
    expect(first.items).toEqual([])
    expect(searchDomestic).toHaveBeenCalledTimes(1)

    // 第二轮切换可播源为 [wy, tx]：wy 命中负缓存跳过搜索，tx 立即搜索并命中！
    const second = await bridgeYtmTracks([makeRanked('v1', '七里香', '周杰倫', 1, 299, '七里香')], {
      anchor: { artist: '陈奕迅', title: '十年' },
      existingDomestic: [],
      playableTargets: ['wy', 'tx'],
      searchDomestic,
      cache,
      targetCount: 5,
      deadlineAt: Date.now() + 10_000,
    })
    expect(second.items).toHaveLength(1)
    expect(second.items[0].musicInfo.id).toBe('tx_77')
    expect(searchDomestic).toHaveBeenCalledTimes(2)
    expect(searchDomestic.mock.calls[1][0]).toBe('tx')
  })

  it('预过滤返回准确淘汰分类计数（session / loved / disliked / anchor）', async() => {
    const cache = new SimilarCandidateCache()
    const searchDomestic = vi.fn().mockResolvedValue([])
    const result = await bridgeYtmTracks(
      [
        makeRanked('v1', '晴天 (Live)', '周杰倫', 1), // anchor 变体
        makeRanked('v2', '花海', '周杰倫', 2), // session 已播
        makeRanked('v3', '江南', '林俊傑', 3), // loved 红心
        makeRanked('v4', '十年', '陳奕迅', 4), // disliked 不再推荐
      ],
      {
        anchor: { artist: '周杰伦', title: '晴天' },
        existingDomestic: [],
        playableTargets: ['wy'],
        searchDomestic,
        cache,
        excludeTracks: [{ artist: '周杰伦', title: '花海' }],
        lovedTracks: [{ artist: '林俊杰', title: '江南' }],
        dislikedTracks: [{ artist: '陈奕迅', title: '十年' }],
        targetCount: 5,
        deadlineAt: Date.now() + 10_000,
      },
    )
    expect(result.items).toEqual([])
    expect(result.prefiltered).toEqual({ anchor: 1, session: 1, loved: 1, disliked: 1 })
    expect(searchDomestic).not.toHaveBeenCalled()
  })

  it('受控并发上限 <= 3 且遵守共享截止时间提前中止', async() => {
    const cache = new SimilarCandidateCache()
    let active = 0
    let maxConcurrent = 0
    const clock = { now: 1000 }
    const searchDomestic = vi.fn(async(_provider: DomesticBridgeProvider, keyword: string) => {
      active++
      maxConcurrent = Math.max(maxConcurrent, active)
      await new Promise(resolve => setTimeout(resolve, 15))
      active--
      const title = keyword.split(' ')[0]
      return [makeOnlineInfo('wy', title, title, 'Artist', '04:00')]
    })

    const tracks = Array.from({ length: 10 }, (_, i) => makeRanked(`v${i}`, `Song${i}`, 'Artist', i + 1))
    const result = await bridgeYtmTracks(tracks, {
      anchor: { artist: 'Other', title: 'Origin' },
      existingDomestic: [],
      playableTargets: ['wy'],
      searchDomestic,
      cache,
      targetCount: 5,
      deadlineAt: clock.now + 5000,
      now: () => clock.now,
    })

    expect(maxConcurrent).toBeLessThanOrEqual(3)
    // 槽位预留：目标 5 首严格只搜索并解析 5 首，绝不超额发出第 6/7 首搜索
    expect(result.items).toHaveLength(5)
    expect(searchDomestic).toHaveBeenCalledTimes(5)
    expect(result.hasUnprocessed).toBe(true)

    // 预算剩余落入 <= 200ms 死区时也必须标记 timedOut=true & hasUnprocessed=true（不得误报 empty）
    clock.now = 5900
    const tightBudget = await bridgeYtmTracks(tracks, {
      anchor: { artist: 'Other', title: 'Origin' },
      existingDomestic: [],
      playableTargets: ['wy'],
      searchDomestic,
      cache: new SimilarCandidateCache(),
      targetCount: 5,
      deadlineAt: 6000,
      now: () => clock.now,
    })
    expect(tightBudget.timedOut).toBe(true)
    expect(tightBudget.hasUnprocessed).toBe(true)
    expect(tightBudget.items).toEqual([])

    // 预算已耗尽时立即停止，不发新请求
    clock.now = 7000
    const timedOut = await bridgeYtmTracks(tracks, {
      anchor: { artist: 'Other', title: 'Origin' },
      existingDomestic: [],
      playableTargets: ['wy'],
      searchDomestic,
      cache: new SimilarCandidateCache(),
      targetCount: 5,
      deadlineAt: 6000,
      now: () => clock.now,
    })
    expect(timedOut.timedOut).toBe(true)
    expect(timedOut.items).toEqual([])
  })

  it('所有可播目标源发生网络错误时区分 error 与 clean no-match，且不写负缓存', async() => {
    const cache = new SimilarCandidateCache()
    const searchDomestic = vi.fn().mockRejectedValue(new Error('offline'))
    const result = await bridgeYtmTracks([makeRanked('v1', '晴天', '周杰伦', 1)], {
      anchor: { artist: '林俊杰', title: '江南' },
      existingDomestic: [],
      playableTargets: ['wy'],
      searchDomestic,
      cache,
      targetCount: 5,
      deadlineAt: Date.now() + 10_000,
    })
    expect(result.items).toEqual([])
    expect(result.bridgeErrorCount).toBe(1)
    expect(result.lastBridgeError).toContain('offline')
    expect(result.unmatchedCount).toBe(0)
    expect(cache.getBridge('v1', 'wy').hit).toBe(false)
  })

  it('R2 回归：双向严格门禁拒绝 YTM 独唱 "A" 误配国内合唱 "B、A"，但允许顺序互换的同一合唱 "A、B" ↔ "B、A"', async() => {
    const cache = new SimilarCandidateCache()
    const searchDomestic = vi.fn(async(_provider: DomesticBridgeProvider, keyword: string) => {
      if (keyword.includes('独唱曲')) {
        return [makeOnlineInfo('wy', 'duet_wrong', '独唱曲', '主唱B、歌手A', '04:00', 'Album')]
      }
      return [makeOnlineInfo('wy', 'duet_ok', '合唱曲', '主唱B、歌手A', '04:00', 'Album')]
    })
    const result = await bridgeYtmTracks(
      [
        makeRanked('v_solo', '独唱曲', '歌手A', 1, 240, 'Album'),
        makeRanked('v_duet', '合唱曲', '歌手A、主唱B', 2, 240, 'Album'),
      ],
      {
        anchor: { artist: 'Other', title: 'Anchor' },
        existingDomestic: [],
        playableTargets: ['wy'],
        searchDomestic,
        cache,
        targetCount: 5,
        deadlineAt: Date.now() + 10_000,
      },
    )
    expect(result.items.map(i => i.musicInfo.id)).toEqual(['wy_duet_ok'])
    expect(result.unmatchedCount).toBe(1)
    expect(result.unmatchedTracks.map(t => t.track.videoId)).toEqual(['v_solo'])
  })

  it('R2 回归：外部 budget AbortSignal 触发时立即取消在途国内桥接并标记 timedOut=true', async() => {
    const controller = new AbortController()
    const cancelFn = vi.fn()
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    const searchDomestic = vi.fn(() => {
      const p = new Promise<LX.Music.MusicInfoOnline[]>(() => {}) as Promise<LX.Music.MusicInfoOnline[]> & { cancel?: () => void }
      p.cancel = cancelFn
      return p
    })
    const pending = bridgeYtmTracks([makeRanked('v1', '慢歌', '歌手', 1)], {
      anchor: { artist: 'Other', title: 'Anchor' },
      existingDomestic: [],
      playableTargets: ['wy'],
      searchDomestic,
      cache: new SimilarCandidateCache(),
      targetCount: 5,
      deadlineAt: Date.now() + 60_000,
      signal: controller.signal,
    })
    await vi.waitFor(() => { expect(searchDomestic).toHaveBeenCalledTimes(1) })
    controller.abort()
    const res = await pending
    expect(cancelFn).toHaveBeenCalledTimes(1)
    expect(res.timedOut).toBe(true)
    expect(res.hasUnprocessed).toBe(true)
  })
})
