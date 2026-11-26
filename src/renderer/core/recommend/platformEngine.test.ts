import { beforeEach, describe, expect, it, vi } from 'vitest'
import { explorePlatformOnce, PlatformRecallFailedError } from './platformEngine'
import type { PlatformRecallAnchor, PlatformRecallResult } from './platformRecall'
import type { SimilarProviderId } from './similarFusion'
import { addDislikeInfo, clearDislikeInfo } from '@renderer/store/dislikeList/action'

const mocks = vi.hoisted(() => ({
  recall: vi.fn(),
  addQueue: vi.fn(),
  getListMusics: vi.fn(),
  queue: [] as any[],
}))
vi.mock('./platformRecall', () => ({ recallPlatformSimilar: mocks.recall }))
vi.mock('@renderer/store/player/action', () => ({ addTempPlayList: mocks.addQueue }))
vi.mock('@renderer/store/player/state', () => ({ tempPlayList: mocks.queue }))
vi.mock('@renderer/store/list/listManage/rendererListManage', () => ({ getListMusics: mocks.getListMusics }))
vi.mock('@renderer/store/list/listManage/state', () => ({ loveList: { id: 'love' }, userLists: [] }))

const anchor: PlatformRecallAnchor = {
  artist: '周杰伦', title: '晴天', album: '叶惠美', intervalSec: 269, id: 'wy_186016', source: 'wy', seedIds: { wy: '186016' },
}
const musicInfo = (id: string, name: string, singer: string) => ({ id, name, singer, source: 'wy', interval: '04:00', meta: {} } as any)
const fused = (id: string, name: string, singer: string, providers: Array<[SimilarProviderId, number]> = [['wy', 1]]) => ({
  artist: singer,
  title: name,
  album: 'Album',
  musicInfo: musicInfo(id, name, singer),
  fusionScore: 1,
  alternativeMusicInfos: providers.map(([provider]) => musicInfo(`${provider}_${name}`, name, singer)).filter(info => info.id !== id),
  sources: providers.map(([provider, rank]) => ({ provider, rank, musicInfo: musicInfo(`${provider}_${name}`, name, singer) })),
})

const recallResult = (over: Partial<PlatformRecallResult> = {}): PlatformRecallResult => ({
  state: 'ok',
  items: [fused('wy_1', '花海', '周杰伦')],
  providers: [{ provider: 'wy', status: 'success', seedId: '186016', fromCache: false }],
  error: null,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  clearDislikeInfo()
  mocks.queue.splice(0)
  mocks.getListMusics.mockResolvedValue([])
  mocks.recall.mockResolvedValue(recallResult())
})

describe('平台相似推荐引擎', () => {
  it('平台请求途中收藏候选的跨平台同曲，返回后不入队', async() => {
    let resolveRecall!: (value: PlatformRecallResult) => void
    mocks.recall.mockImplementationOnce(async() => new Promise(resolve => { resolveRecall = resolve }))
    const pending = explorePlatformOnce({ anchor })
    await vi.waitFor(() => { expect(mocks.recall).toHaveBeenCalledOnce() })
    mocks.getListMusics.mockResolvedValue([musicInfo('tx_loved', '花海', '周杰伦')])
    resolveRecall(recallResult())
    const result = await pending
    expect(result.candidates).toEqual([])
    expect(result.meta.state).toBe('empty-after-filter')
    expect(mocks.addQueue).not.toHaveBeenCalled()
  })

  it('全局屏蔽歌手既传给召回过滤，也在直接入队前校验', async() => {
    addDislikeInfo([{ name: '', singer: '周杰伦' }])
    const result = await explorePlatformOnce({ anchor })
    expect(mocks.recall.mock.calls[0][1].isExcluded(musicInfo('wy_1', '花海', '周杰伦'))).toBe(true)
    expect(result.candidates).toEqual([])
    expect(result.meta.state).toBe('empty-after-filter')
    expect(mocks.addQueue).not.toHaveBeenCalled()
  })

  it('相似请求期间手动入队的同曲不重复插入', async() => {
    let resolveRecall!: (value: PlatformRecallResult) => void
    mocks.recall.mockImplementationOnce(async() => new Promise(resolve => { resolveRecall = resolve }))
    const pending = explorePlatformOnce({ anchor })
    await vi.waitFor(() => { expect(mocks.recall).toHaveBeenCalledOnce() })
    mocks.queue.push({ musicInfo: musicInfo('tx_1', '花海', '周杰伦') })
    resolveRecall(recallResult())
    const result = await pending
    expect(result.candidates).toEqual([])
    expect(result.meta.state).toBe('empty-after-filter')
    expect(mocks.addQueue).not.toHaveBeenCalled()
  })

  it('成功结果追加队尾入队，不打断当前播放（isTop=false）', async() => {
    const result = await explorePlatformOnce({ anchor, appendMode: 'bottom' })
    expect(result.engine).toBe('platform')
    expect(result.candidates).toHaveLength(1)
    expect(mocks.addQueue).toHaveBeenCalledTimes(1)
    expect(mocks.addQueue.mock.calls[0][0][0]).toMatchObject({ listId: null, isTop: false })
    expect(mocks.addQueue.mock.calls[0][0][0].musicInfo.id).toBe('wy_1')
  })

  it('enqueue=false 不入队（会话路径先登记归属再自行入队）', async() => {
    await explorePlatformOnce({ anchor, enqueue: false })
    expect(mocks.addQueue).not.toHaveBeenCalled()
  })

  it('全部平台失败抛错（走会话层有限重试，不静默回退）', async() => {
    mocks.recall.mockResolvedValue(recallResult({ state: 'all-failed', items: [], error: 'wy: down；tx: down' }))
    await expect(explorePlatformOnce({ anchor })).rejects.toThrow('down')
    expect(mocks.addQueue).not.toHaveBeenCalled()
  })

  it.each(['exhausted', 'no-match', 'empty', 'empty-after-filter'] as const)('零候选状态 %s 不抛错、不入队、状态可区分', async(state) => {
    mocks.recall.mockResolvedValue(recallResult({ state, items: [] }))
    const result = await explorePlatformOnce({ anchor })
    expect(result.meta.state).toBe(state)
    expect(result.candidates).toEqual([])
    expect(mocks.addQueue).not.toHaveBeenCalled()
  })

  it('红心歌由引擎收集并传给召回（保持发现新歌语义）', async() => {
    mocks.getListMusics.mockResolvedValue([{ id: 'wy_9', singer: '周杰伦', name: '花海' }])
    await explorePlatformOnce({ anchor })
    expect(mocks.recall.mock.calls[0][1].lovedTracks).toEqual([{ artist: '周杰伦', title: '花海' }])
  })

  it('当前稍后播放队列曲目传给召回（同曲不重复插入）', async() => {
    mocks.queue.push({ musicInfo: { id: 'wy_8', singer: '林俊杰', name: '江南' } })
    await explorePlatformOnce({ anchor })
    expect(mocks.recall.mock.calls[0][1].queueTracks).toEqual([{ id: 'wy_8', artist: '林俊杰', title: '江南' }])
  })

  it('理由只陈述可验证事实：单来源标注平台，双来源标注共同推荐', async() => {
    mocks.recall.mockResolvedValue(recallResult({
      items: [
        fused('wy_1', '共同曲', 'A', [['wy', 2], ['tx', 1]]),
        fused('wy_2', '单源曲', 'B', [['tx', 3]]),
      ],
    }))
    const result = await explorePlatformOnce({ anchor })
    expect(result.candidates[0].reason).toBe('两个平台共同推荐')
    expect(result.candidates[0].source).toBe('aggregated')
    expect(result.candidates[1].reason).toBe('QQ 音乐相关歌曲推荐')
    expect(result.candidates[1].source).toBe('tx')
  })

  it('来源证据（各来源排名与备用音源）透传到视图', async() => {
    const result = await explorePlatformOnce({ anchor })
    expect(result.candidates[0].sources[0]).toMatchObject({ provider: 'wy', rank: 1 })
    expect(result.candidates[0].sources[0].musicInfo.id).toBe('wy_花海')
  })

  it('召回前/后取消直接抛取消错误，不入队', async() => {
    mocks.recall.mockResolvedValue(recallResult())
    await expect(explorePlatformOnce({ anchor, isCancelled: () => true })).rejects.toThrow('取消')
    expect(mocks.addQueue).not.toHaveBeenCalled()
  })

  it('部分来源失败但仍有结果：状态 ok 且携带非阻断错误信息', async() => {
    mocks.recall.mockResolvedValue(recallResult({ error: 'tx: 请求超时' }))
    const result = await explorePlatformOnce({ anchor })
    expect(result.meta.state).toBe('ok')
    expect(result.meta.error).toContain('tx')
    expect(mocks.addQueue).toHaveBeenCalledTimes(1)
  })

  it('三平台共同推荐与 YouTube Music 单源理由准确标注，all-failed 抛出携带本轮 providers 的 PlatformRecallFailedError', async() => {
    mocks.recall.mockResolvedValueOnce(recallResult({
      items: [
        fused('wy_1', '三源曲', 'A', [['wy', 1], ['tx', 2], ['ytm', 1]]),
        fused('wy_2', '仅YTM', 'B', [['ytm', 2]]),
      ],
    }))
    const okRes = await explorePlatformOnce({ anchor })
    expect(okRes.candidates[0].reason).toBe('三个平台共同推荐')
    expect(okRes.candidates[0].source).toBe('aggregated')
    expect(okRes.candidates[1].reason).toBe('YouTube Music 相关歌曲推荐')
    expect(okRes.candidates[1].source).toBe('ytm')

    const failedProviders = [
      { provider: 'wy' as const, status: 'error' as const, seedId: null, fromCache: false, error: 'wy down' },
      { provider: 'ytm' as const, status: 'region-blocked' as const, seedId: null, fromCache: false },
    ]
    mocks.recall.mockResolvedValueOnce(recallResult({ state: 'all-failed', items: [], providers: failedProviders, error: 'wy: wy down' }))
    await expect(explorePlatformOnce({ anchor })).rejects.toSatisfy((err: unknown) => {
      return err instanceof PlatformRecallFailedError && err.providers.length === 2 && err.providers[1].status === 'region-blocked'
    })
  })

  it('提交前复核 YTM 独有候选播放能力：源失效时剔除并返回 no-playable-source', async() => {
    mocks.recall.mockResolvedValueOnce(recallResult({
      items: [fused('wy_only_ytm', '桥接曲', 'C', [['ytm', 1]])],
    }))
    const result = await explorePlatformOnce({
      anchor,
      canPlaySource: source => source === 'tx',
    })
    expect(result.candidates).toEqual([])
    expect(result.meta.state).toBe('no-playable-source')
    expect(mocks.addQueue).not.toHaveBeenCalled()
  })

  it('提交前复核覆盖所有含 YTM 证据的融合候选（如 wy+ytm）：wy 不可播时晋升可播 tx，全不可播时返回 no-playable-source', async() => {
    const wyInfo = { id: 'wy_dup', name: '跨源曲', singer: 'A', source: 'wy', meta: { albumName: '' } } as any
    const txInfo = { id: 'tx_dup', name: '跨源曲', singer: 'A', source: 'tx', meta: { albumName: '' } } as any
    const mergedItem = {
      id: 'wy_dup',
      artist: 'A',
      title: '跨源曲',
      album: '',
      musicInfo: wyInfo,
      alternativeMusicInfos: [txInfo],
      fusionScore: 0.03,
      sources: [
        { provider: 'wy' as const, rank: 1, musicInfo: wyInfo },
        { provider: 'ytm' as const, rank: 1, musicInfo: txInfo },
      ],
    }

    mocks.recall.mockResolvedValueOnce(recallResult({ items: [mergedItem] }))
    const promoted = await explorePlatformOnce({
      anchor,
      canPlaySource: source => source === 'tx',
    })
    expect(promoted.candidates).toHaveLength(1)
    expect(promoted.candidates[0].musicInfo?.id).toBe('tx_dup')
    expect(mocks.addQueue).toHaveBeenCalledTimes(1)
    expect(mocks.addQueue.mock.calls[0][0][0].musicInfo.id).toBe('tx_dup')

    mocks.addQueue.mockClear()
    mocks.recall.mockResolvedValueOnce(recallResult({ items: [mergedItem] }))
    const dropped = await explorePlatformOnce({
      anchor,
      canPlaySource: () => false,
    })
    expect(dropped.candidates).toEqual([])
    expect(dropped.meta.state).toBe('no-playable-source')
    expect(mocks.addQueue).not.toHaveBeenCalled()
  })

  it('向 recallPlatformSimilar 透传 allowDirectYtmPlayback，确保无国内源时原生 ytm 候选可直出队列', async() => {
    const ytmInfo = { id: 'ytm_only1', name: 'Only On YTM', singer: 'Indie', source: 'ytm', meta: { albumName: '' } } as any
    mocks.recall.mockResolvedValueOnce(recallResult({
      items: [{
        artist: 'Indie',
        title: 'Only On YTM',
        album: '',
        musicInfo: ytmInfo,
        alternativeMusicInfos: [],
        fusionScore: 0.02,
        sources: [{ provider: 'ytm', rank: 1, musicInfo: ytmInfo }],
      }],
    }))
    const res = await explorePlatformOnce({
      anchor,
      enabledProviders: ['ytm'],
      playableTargets: [],
      allowDirectYtmPlayback: true,
      canPlaySource: source => source === 'ytm',
    })
    expect(mocks.recall).toHaveBeenCalledWith(anchor, expect.objectContaining({
      allowDirectYtmPlayback: true,
      playableTargets: [],
    }))
    expect(res.candidates).toHaveLength(1)
    expect(res.candidates[0].musicInfo?.id).toBe('ytm_only1')
    expect(mocks.addQueue).toHaveBeenCalledTimes(1)
  })
})
