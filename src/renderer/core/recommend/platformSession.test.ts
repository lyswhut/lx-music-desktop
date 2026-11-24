import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { effectScope, nextTick } from 'vue'
import type * as SessionModule from './session'

const mocks = vi.hoisted(() => {
  // 旧 AI 配置齐全且开关为开：平台默认模式下仍不得发任何 LLM 请求
  const setting: Record<string, any> = {
    'recommend.radio': false,
    'recommend.radius': 50,
    'recommend.autoRefill': true,
    'ai.enable': true,
    'ai.apiKey': 'legacy-key',
    'ai.model': 'legacy-model',
  }
  return {
    // 旧 AI 引擎入口（平台模式下必须不被调用——无静默回退）
    explore: vi.fn(),
    // 平台召回边界（真实 platformEngine 的依赖）
    platformRecall: vi.fn(),
    // LLM 客户端间谍（平台模式全链路必须 0 调用）
    llm: vi.fn(),
    llmValidated: vi.fn(),
    addQueue: vi.fn(),
    removeQueue: vi.fn(),
    playNow: vi.fn(),
    playNext: vi.fn(),
    getListMusics: vi.fn(),
    onProfileSignal: vi.fn(),
    recordSkip: vi.fn(),
    isPlay: { value: false },
    setting,
    player: { musicInfo: null as any, alternativeMusicInfos: undefined as LX.Music.MusicInfoOnline[] | undefined },
    queue: [] as any[],
  }
})
vi.mock('./engine', () => ({ exploreOnce: mocks.explore }))
vi.mock('./platformRecall', () => ({ recallPlatformSimilar: mocks.platformRecall }))
vi.mock('./llm', () => ({ llmComplete: mocks.llm, llmCompleteWithValidation: mocks.llmValidated }))
vi.mock('@renderer/store/setting', async() => {
  const { reactive } = await import('vue')
  return { appSetting: reactive(mocks.setting) }
})
vi.mock('@renderer/store/player/state', () => ({ playInfo: { isSelectionQueue: false }, playMusicInfo: mocks.player, tempPlayList: mocks.queue, isPlay: mocks.isPlay }))
vi.mock('@renderer/store/player/action', () => ({ addTempPlayList: mocks.addQueue, removeTempPlayList: mocks.removeQueue }))
vi.mock('@renderer/core/player', () => ({ playMusicInfoNow: mocks.playNow, playNext: mocks.playNext }))
vi.mock('@renderer/utils/data', () => ({ getRecommendMetrics: async() => null, saveRecommendMetrics: vi.fn() }))
vi.mock('./feature', () => ({ startFeatureCollection: vi.fn(), stopFeatureCollection: vi.fn() }))
vi.mock('./profile', () => ({ getProfileState: () => null, onProfileSignal: mocks.onProfileSignal, recordRecommendedSkip: mocks.recordSkip }))
vi.mock('@renderer/store/list/listManage/rendererListManage', () => ({ getListMusics: mocks.getListMusics }))
vi.mock('@renderer/store/list/listManage/state', () => ({ loveList: { id: 'love' }, userLists: [] }))

/** 平台召回结果（FusedCandidate 形状的最小构造）。 */
const fusedItem = (id: string, name: string, singer: string) => ({
  artist: singer,
  title: name,
  album: 'Album',
  musicInfo: { id, name, singer, source: 'wy', interval: '04:00', meta: {} } as any,
  fusionScore: 1,
  alternativeMusicInfos: [] as LX.Music.MusicInfoOnline[],
  sources: [{ provider: 'wy' as const, rank: 1, musicInfo: { id, name, singer, source: 'wy', meta: {} } as any }],
})
const recallOk = (items = [fusedItem('wy_1', '花海', '周杰伦')]) => ({
  state: 'ok' as const,
  items,
  providers: [{ provider: 'wy' as const, status: 'success' as const, seedId: '186016', fromCache: false }],
  error: null,
})

let session: typeof SessionModule
let setting: typeof mocks.setting
beforeEach(async() => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.clearAllMocks()
  mocks.setting['recommend.autoRefill'] = true
  mocks.setting['recommend.radio'] = false
  mocks.setting['recommend.providers.wy'] = true
  mocks.setting['recommend.providers.tx'] = true
  mocks.setting['recommend.ytm.enable'] = true
  mocks.setting['recommend.ytm.proxy.enable'] = false
  mocks.setting['recommend.ytm.proxy.host'] = ''
  mocks.setting['recommend.ytm.proxy.port'] = ''
  mocks.isPlay.value = false
  delete mocks.setting['recommend.engine']
  mocks.player.musicInfo = {
    id: 'wy_186016',
    singer: '周杰伦',
    name: '晴天',
    source: 'wy',
    interval: '04:29',
    meta: { songId: '186016', albumName: '叶惠美' },
  }
  mocks.player.alternativeMusicInfos = undefined
  mocks.queue.splice(0)
  mocks.removeQueue.mockImplementation(index => mocks.queue.splice(index, 1))
  mocks.addQueue.mockImplementation(items => mocks.queue.push(...items))
  mocks.getListMusics.mockResolvedValue([])
  mocks.platformRecall.mockResolvedValue(recallOk())
  vi.stubGlobal('window', { lx: { isProd: true }, app_event: new EventEmitter() })
  setting = (await import('@renderer/store/setting')).appSetting
  session = await import('./session')
})

const emitEvent = (name: string, ...args: unknown[]): void => {
  ;(window.app_event as unknown as EventEmitter).emit(name, ...args)
}
const endorse = (kind: 'complete' | 'love' = 'complete'): void => {
  mocks.onProfileSignal.mock.calls[0][0]({ kind, id: 'wy_1', artist: '周杰伦', title: '花海' })
}
const changeSong = (id: string, reason: LX.Player.MusicChangeReason = 'user'): void => {
  mocks.player.musicInfo = fusedItem(id, '花海', '周杰伦').musicInfo
  emitEvent('musicToggled', reason)
}

describe('隐式续补服从设置和队列容量', () => {
  it.each(['complete', 'love'] as const)('关闭自动续补后 %s 仍更新偏好但不补队列', async(kind) => {
    mocks.setting['recommend.autoRefill'] = false
    await session.startSession()
    endorse(kind)
    await vi.advanceTimersByTimeAsync(1500)
    expect(mocks.platformRecall).toHaveBeenCalledOnce()
    // 用户显式调参仍可续补，且读取到刚更新的会话偏好。
    session.setRadius(40)
    await vi.advanceTimersByTimeAsync(1200)
    expect(mocks.platformRecall).toHaveBeenCalledTimes(2)
    expect(mocks.platformRecall.mock.calls[1][1].profileBoost('周杰伦')).toBe(10)
  })

  it('队列充足时听完不触发续补', async() => {
    mocks.platformRecall.mockResolvedValue(recallOk([
      fusedItem('wy_1', '花海', '周杰伦'),
      ...Array.from({ length: 4 }, (_, i) => fusedItem(`other-${i}`, `Song ${i}`, `Artist ${i}`)),
    ]))
    await session.startSession()
    expect(mocks.queue.length).toBeGreaterThan(3)
    endorse()
    await vi.advanceTimersByTimeAsync(1500)
    expect(mocks.platformRecall).toHaveBeenCalledOnce()
  })

  it('队列不足且允许自动续补时听完正常补歌', async() => {
    await session.startSession()
    endorse()
    await vi.advanceTimersByTimeAsync(1200)
    expect(mocks.platformRecall).toHaveBeenCalledTimes(2)
  })

  it('防抖等待期间关闭自动续补后不再发起请求', async() => {
    await session.startSession()
    endorse()
    mocks.setting['recommend.autoRefill'] = false
    await vi.advanceTimersByTimeAsync(1500)
    expect(mocks.platformRecall).toHaveBeenCalledOnce()
    expect(session.refillState.value).toBe('idle')
  })

  it('隐式事件不能把已经安排的显式续补降级', async() => {
    await session.startSession()
    session.setRadius(40)
    endorse()
    mocks.setting['recommend.autoRefill'] = false
    await vi.advanceTimersByTimeAsync(1500)
    expect(mocks.platformRecall).toHaveBeenCalledTimes(2)
  })

  it('自动续补请求途中关闭开关后丢弃结果', async() => {
    await session.startSession()
    let release!: (value: ReturnType<typeof recallOk>) => void
    mocks.platformRecall.mockImplementationOnce(async() => new Promise(resolve => { release = resolve }))
    endorse()
    await vi.advanceTimersByTimeAsync(1200)
    expect(release).toBeDefined()
    mocks.setting['recommend.autoRefill'] = false
    release(recallOk([fusedItem('wy_2', '新歌', '新艺人')]))
    await vi.advanceTimersByTimeAsync(0)
    expect(mocks.addQueue).toHaveBeenCalledOnce()
    expect(session.refillState.value).toBe('idle')
  })

  it('自动续补失败后的重试也遵守开关', async() => {
    await session.startSession()
    mocks.platformRecall.mockRejectedValueOnce(new Error('offline'))
    endorse()
    await vi.advanceTimersByTimeAsync(1200)
    expect(session.refillState.value).toBe('retrying')
    mocks.setting['recommend.autoRefill'] = false
    await vi.advanceTimersByTimeAsync(16000)
    expect(mocks.platformRecall).toHaveBeenCalledTimes(2)
    expect(session.refillState.value).toBe('idle')
  })
})

describe('推荐曲负反馈只来自实际收听后的主动切歌', () => {
  beforeEach(() => { mocks.setting['recommend.autoRefill'] = false })

  it('从未开始播放的歌曲不计负反馈，即使上一曲的 isPlay 尚未清零', async() => {
    await session.startSession()
    mocks.isPlay.value = true
    changeSong('wy_1')
    await vi.advanceTimersByTimeAsync(10000)
    changeSong('other')
    expect(mocks.recordSkip).not.toHaveBeenCalled()
  })

  it.each(['ended', 'error', 'removed'] as const)('%s 自动切换不计口味负反馈', async(reason) => {
    await session.startSession()
    changeSong('wy_1')
    emitEvent('play')
    await vi.advanceTimersByTimeAsync(10000)
    changeSong('other', reason)
    expect(mocks.recordSkip).not.toHaveBeenCalled()
  })

  it.each(['playerError', 'error', 'stop'])('%s 中断后用户切歌也不计口味负反馈', async(event) => {
    await session.startSession()
    changeSong('wy_1')
    emitEvent('play')
    await vi.advanceTimersByTimeAsync(10000)
    emitEvent(event)
    changeSong('other')
    expect(mocks.recordSkip).not.toHaveBeenCalled()
  })

  it('主动短听跳过仍记负反馈，暂停时间不计入播放时长', async() => {
    await session.startSession()
    changeSong('wy_1')
    emitEvent('play')
    await vi.advanceTimersByTimeAsync(10000)
    emitEvent('pause')
    await vi.advanceTimersByTimeAsync(40000)
    changeSong('other')
    expect(mocks.recordSkip).toHaveBeenCalledExactlyOnceWith({ id: 'wy_1', artist: '周杰伦', title: '花海', playedSeconds: 10 })
  })

  it('错误后恢复播放，后续主动切歌仍可形成负反馈', async() => {
    await session.startSession()
    changeSong('wy_1')
    emitEvent('error')
    emitEvent('play')
    await vi.advanceTimersByTimeAsync(10000)
    changeSong('other')
    expect(mocks.recordSkip).toHaveBeenCalledOnce()
  })
})
afterEach(() => { session.endSession(); vi.useRealTimers(); vi.unstubAllGlobals() })

describe('平台推荐默认路径：零 LLM 与无静默回退（AC3）', () => {
  it('平台请求中收藏的同曲不入队，也不登记到路径和推荐归属', async() => {
    let release!: (value: ReturnType<typeof recallOk>) => void
    mocks.platformRecall.mockImplementationOnce(async() => new Promise(resolve => { release = resolve }))
    const pending = session.startSession()
    await vi.waitFor(() => { expect(mocks.platformRecall).toHaveBeenCalledOnce() })
    mocks.getListMusics.mockResolvedValue([{ id: 'tx_loved', singer: '周杰伦', name: '花海' }])
    release(recallOk())
    await pending
    expect(mocks.addQueue).not.toHaveBeenCalled()
    expect(session.sessionView.value.path).toEqual([])
    expect(session.sessionView.value.recommendedIds).toEqual([])
    expect(session.lastPlatformState.value).toBe('empty-after-filter')
  })

  it('读取提交前收藏期间收台重开，旧检查完成后不影响新会话', async() => {
    let release!: (items: any[]) => void
    mocks.getListMusics.mockResolvedValueOnce([]).mockImplementationOnce(async() => new Promise(resolve => { release = resolve }))
    const pending = session.startSession()
    await vi.waitFor(() => { expect(mocks.getListMusics).toHaveBeenCalledTimes(2) })
    session.endSession()
    mocks.player.musicInfo = { ...mocks.player.musicInfo, id: 'new-anchor' }
    await session.startSession()
    release([])
    await pending
    expect(mocks.addQueue).toHaveBeenCalledOnce()
    expect(session.sessionView.value.anchor.id).toBe('new-anchor')
    expect(session.sessionView.value.recommendedIds).toEqual(['wy_1'])
    expect(mocks.queue).toHaveLength(1)
  })

  it('默认模式（含旧 ai.enable=true）：初始推荐走平台路径，0 次 LLM、不进旧引擎', async() => {
    await session.startSession()
    expect(mocks.platformRecall).toHaveBeenCalledTimes(1)
    expect(mocks.explore).not.toHaveBeenCalled()
    expect(mocks.llm).not.toHaveBeenCalled()
    expect(mocks.llmValidated).not.toHaveBeenCalled()
    // 入队为队尾追加（不打断当前播放）
    expect(mocks.addQueue).toHaveBeenCalledTimes(1)
    expect(mocks.addQueue.mock.calls[0][0][0]).toMatchObject({ isTop: false })
  })

  it('锚点携带来源与原生平台标识传给召回（不解析全局 id 猜测）', async() => {
    await session.startSession()
    const anchor = mocks.platformRecall.mock.calls[0][0]
    expect(anchor.source).toBe('wy')
    expect(anchor.seedIds).toEqual({ wy: '186016' })
    expect(anchor.intervalSec).toBe(269)
    expect(anchor.id).toBe('wy_186016')
  })

  it('续补（改距离触发）仍走平台路径且 0 次 LLM，并排除已推荐曲目', async() => {
    await session.startSession()
    session.setRadius(40)
    await vi.advanceTimersByTimeAsync(1200)
    expect(mocks.platformRecall).toHaveBeenCalledTimes(2)
    expect(mocks.explore).not.toHaveBeenCalled()
    expect(mocks.llm).not.toHaveBeenCalled()
    const refillOptions = mocks.platformRecall.mock.calls[1][1]
    expect(refillOptions.excludeIds).toContain('wy_1')
  })

  it('反馈（喜欢/不再推荐）0 次 LLM；喜欢进入平台画像加成，不再推荐进入后续召回排除', async() => {
    await session.startSession()
    session.applyFeedback('good')
    await vi.advanceTimersByTimeAsync(1200)
    const afterGood = mocks.platformRecall.mock.calls[1][1]
    expect(afterGood.profileBoost('周杰伦')).toBe(10)
    session.applyFeedback('dislike')
    await vi.advanceTimersByTimeAsync(1200)
    expect(mocks.llm).not.toHaveBeenCalled()
    expect(mocks.platformRecall).toHaveBeenCalledTimes(3)
    const afterDislike = mocks.platformRecall.mock.calls[2][1]
    expect(afterDislike.dislikedTracks).toEqual([{ artist: '周杰伦', title: '晴天' }])
  })

  it('平台全部失败：走有限重试，不静默回退旧 AI 引擎或关键词搜索', async() => {
    mocks.platformRecall.mockResolvedValue({ ...recallOk([]), state: 'all-failed', error: 'wy: down；tx: down', items: [] })
    await session.startSession().catch(() => {})
    // initial 失败不重试（重试只作用于 refill），但也不触发旧引擎
    expect(mocks.platformRecall).toHaveBeenCalledTimes(1)
    expect(mocks.explore).not.toHaveBeenCalled()
    expect(mocks.llm).not.toHaveBeenCalled()
    expect(session.refillState.value).toBe('idle')
  })

  it('候选用尽：非失败状态，不重试相同来源，会话保持可切换起点', async() => {
    mocks.platformRecall.mockResolvedValue({ ...recallOk([]), state: 'exhausted', items: [] })
    await session.startSession()
    expect(session.refillState.value).toBe('idle')
    expect(session.lastPlatformState.value).toBe('exhausted')
    // 无重试定时器：长时间推进后不再发起相同请求
    await vi.advanceTimersByTimeAsync(60_000)
    expect(mocks.platformRecall).toHaveBeenCalledTimes(1)
    // 会话仍活跃（切换起点可重新开台）
    expect(session.sessionView.value.active).toBe(true)
  })

  it('无匹配/空结果/过滤完状态可区分展示', async() => {
    for (const state of ['no-match', 'empty', 'empty-after-filter'] as const) {
      mocks.platformRecall.mockResolvedValueOnce({ ...recallOk([]), state, items: [] })
      await session.startSession()
      expect(session.lastPlatformState.value).toBe(state)
      expect(mocks.addQueue).not.toHaveBeenCalled()
      session.endSession()
    }
  })
})

describe('旧引擎值的兼容加载（显式选择才进入）', () => {
  it("显式 'ai'：走旧 AI 引擎并携带 AI 配置", async() => {
    mocks.setting['recommend.engine'] = 'ai'
    mocks.explore.mockResolvedValue({
      engine: 'ai',
      anchor: { artist: '周杰伦', title: '晴天', album: '' },
      position: '',
      featureSheet: {} as any,
      analysis: { summary: '', aiUsed: true, error: null },
      rawAnalysis: {} as any,
      candidates: [],
      meta: { sourceCounts: {}, recallError: null, aiRankError: null },
    })
    await session.startSession()
    expect(mocks.explore).toHaveBeenCalledTimes(1)
    expect(mocks.explore.mock.calls[0][0].ai).toMatchObject({ apiKey: 'legacy-key', model: 'legacy-model' })
    expect(mocks.platformRecall).not.toHaveBeenCalled()
  })

  it("显式 'local'：走旧引擎但不携带 AI 配置（0 LLM）", async() => {
    mocks.setting['recommend.engine'] = 'local'
    mocks.explore.mockResolvedValue({
      engine: 'local',
      anchor: { artist: '周杰伦', title: '晴天', album: '' },
      position: '',
      featureSheet: {} as any,
      analysis: { summary: '', aiUsed: false, error: null },
      rawAnalysis: {} as any,
      candidates: [],
      meta: { sourceCounts: {}, recallError: null, aiRankError: null },
    })
    await session.startSession()
    expect(mocks.explore).toHaveBeenCalledTimes(1)
    expect(mocks.explore.mock.calls[0][0].ai).toBeUndefined()
    expect(mocks.llm).not.toHaveBeenCalled()
  })

  it('垃圾 engine 值回落平台路径（平台推荐为默认）', async() => {
    mocks.setting['recommend.engine'] = 'garbage'
    await session.startSession()
    expect(mocks.platformRecall).toHaveBeenCalledTimes(1)
    expect(mocks.explore).not.toHaveBeenCalled()
  })
})


it('备用平台信息随推荐入队、路径跳播和已播曲重播保留', async() => {
  const item = fusedItem('wy_1', 'Song', 'Artist')
  const alternative = { ...item.musicInfo, id: 'tx_1', source: 'tx' }
  item.sources.push({ provider: 'tx' as any, rank: 1, musicInfo: alternative })
  item.alternativeMusicInfos.push(alternative)
  mocks.platformRecall.mockResolvedValue(recallOk([item]))
  await session.startSession()
  expect(mocks.queue[0].alternativeMusicInfos).toEqual([alternative])
  session.playPathItem('wy_1')
  expect(mocks.playNow).toHaveBeenLastCalledWith(item.musicInfo, null, [alternative])
  mocks.player.musicInfo = item.musicInfo
  ;(window.app_event as unknown as EventEmitter).emit('musicToggled')
  expect(session.sessionView.value.path[0].state).toBe('played')
  session.playPathItem('wy_1')
  expect(mocks.playNow).toHaveBeenLastCalledWith(item.musicInfo, null, [alternative])
})


describe('platform session retained source history', () => {
  it('anchor and dislike preserve preferred and alternative metadata, including download playback', async() => {
    const preferred = mocks.player.musicInfo
    const alternative = { ...preferred, id: 'tx_anchor', source: 'tx', singer: 'Jay Chou', meta: { id: 'tx_native' } }
    mocks.player.musicInfo = { progress: {}, metadata: { musicInfo: preferred } }
    mocks.player.alternativeMusicInfos = [alternative]
    await session.startSession()
    expect(mocks.platformRecall.mock.calls[0][0]).toMatchObject({ musicInfo: preferred, alternativeMusicInfos: [alternative] })
    expect(session.sessionView.value.anchor).toMatchObject({ musicInfo: preferred, alternativeMusicInfos: [alternative] })
    session.applyFeedback('dislike')
    await vi.advanceTimersByTimeAsync(1200)
    expect(mocks.platformRecall.mock.calls[1][1].dislikedTracks).toEqual(expect.arrayContaining([
      { artist: '周杰伦', title: '晴天' }, { artist: 'Jay Chou', title: '晴天' },
    ]))
  })

  it.each([false, true])('opening an existing anchor through retained source IDs is idempotent (current evidence=%s)', async(currentEvidence) => {
    const preferred = mocks.player.musicInfo
    const alternate = { ...preferred, id: 'tx_anchor', source: 'tx', singer: 'Jay Chou' }
    if (!currentEvidence) mocks.player.alternativeMusicInfos = [alternate]
    await session.startSession()
    mocks.player.musicInfo = alternate
    mocks.player.alternativeMusicInfos = currentEvidence ? [preferred] : undefined
    await session.startSession()
    expect(mocks.platformRecall).toHaveBeenCalledOnce()
    expect(session.sessionView.value.anchor.id).toBe(preferred.id)
    expect(mocks.removeQueue).not.toHaveBeenCalled()
  })

  it('platform refill preserves history aliases and source IDs after the queue is consumed', async() => {
    const item = fusedItem('wy_song', 'Song', 'Primary')
    const alternate = { ...item.musicInfo, id: 'tx_song', source: 'tx', singer: 'Alias' }
    item.sources.push({ provider: 'tx' as any, rank: 1, musicInfo: alternate })
    item.alternativeMusicInfos.push(alternate)
    mocks.platformRecall.mockResolvedValue(recallOk([item]))
    await session.startSession()
    mocks.queue.splice(0)
    session.setRadius(40)
    await vi.advanceTimersByTimeAsync(1200)
    const options = mocks.platformRecall.mock.calls[1][1]
    expect(options.excludeIds).toEqual(['wy_song', 'tx_song'])
    expect(options.excludeTracks).toEqual(expect.arrayContaining([
      expect.objectContaining({ artist: 'Primary', title: 'Song' }),
      expect.objectContaining({ artist: 'Alias', title: 'Song' }),
    ]))
  })
})

describe('会话状态机缺陷修复回归（配置热切换 / all-failed 徽章 / version 换源 / 单曲操作 / 显式刷新）', () => {
  it('在途计划期间切换推荐来源立即取消旧计划并释放单飞锁，同时保全既有队列归属与剩余计数', async() => {
    const scope = effectScope()
    try {
      scope.run(() => { session.initRecommendRadio() })
      await session.startSession()
      expect(session.sessionView.value.remaining).toBe(1)

      let releaseStale!: (v: ReturnType<typeof recallOk>) => void
      mocks.platformRecall.mockImplementationOnce(async() => new Promise(resolve => { releaseStale = resolve }))
      session.refillNow()
      await vi.waitFor(() => { expect(releaseStale).toBeDefined() })

      // 召回途中关闭 tx 来源：旧计划失效且单飞锁释放，已有队列项仍归本会话（remaining === 1）
      mocks.platformRecall.mockResolvedValueOnce(recallOk([fusedItem('wy_fresh', '新来源曲', '新歌手')]))
      setting['recommend.providers.tx'] = false
      await nextTick()
      expect(session.sessionView.value.remaining).toBe(1)

      // 旧计划迟到返回被丢弃
      releaseStale(recallOk([fusedItem('wy_stale', '过期曲', '旧歌手')]))
      await vi.advanceTimersByTimeAsync(1200)

      expect(session.sessionView.value.path.map(p => p.id)).not.toContain('wy_stale')
      expect(session.sessionView.value.path.map(p => p.id)).toContain('wy_fresh')
      // 收台时两批同会话入队项均被正确清理
      session.endSession()
      expect(mocks.queue).toEqual([])
    } finally {
      scope.stop()
    }
  })

  it('第 2 轮 all-failed 刷新 lastPlatformProviders 为本轮失败状态并清空上轮部分错误', async() => {
    mocks.platformRecall.mockResolvedValueOnce({
      ...recallOk(),
      error: 'tx: timeout',
      providers: [
        { provider: 'wy' as const, status: 'success' as const, seedId: '186016', fromCache: false },
        { provider: 'tx' as const, status: 'error' as const, seedId: null, fromCache: false },
      ],
    })
    await session.startSession()
    expect(session.lastPlatformProviders.value[0].status).toBe('success')
    expect(session.lastPlatformSourceError.value).toContain('tx: timeout')

    mocks.platformRecall.mockResolvedValueOnce({
      state: 'all-failed' as const,
      items: [],
      providers: [
        { provider: 'wy' as const, status: 'error' as const, seedId: null, fromCache: false },
        { provider: 'tx' as const, status: 'error' as const, seedId: null, fromCache: false },
      ],
      error: 'wy: down；tx: down',
    })
    session.refillNow()
    await vi.advanceTimersByTimeAsync(0)

    // 不再残留第 1 轮的 wy=success 绿徽章和上轮 partial source error
    expect(session.lastPlatformProviders.value.every(p => p.status === 'error')).toBe(true)
    expect(session.lastPlatformSourceError.value).toBe('')
    expect(session.lastErrorText.value).toContain('down')
  })

  it("reason='version' 同曲切换音源不触发短听跳过负反馈，并保留路径推荐来源徽章", async() => {
    setting['recommend.autoRefill'] = false
    await session.startSession()
    changeSong('wy_1')
    emitEvent('play')
    await vi.advanceTimersByTimeAsync(5000)
    // 同曲换源（reason='version'）
    mocks.player.musicInfo = { id: 'tx_1_ver', name: '花海', singer: '周杰伦', source: 'tx', interval: '04:00', meta: {} }
    emitEvent('musicToggled', 'version')
    expect(mocks.recordSkip).not.toHaveBeenCalled()
    expect(session.sessionView.value.path[0].recommendSources).toEqual([{ provider: 'wy', rank: 1 }])
  })

  it('dislikePathItem 标记不再推荐、清除相反喜欢态、移除本会话队列项并在正播时切下一首', async() => {
    await session.startSession()
    const manual = { listId: 'manual', musicInfo: { id: 'wy_1', name: '花海', singer: '周杰伦', source: 'wy', meta: {} } }
    mocks.queue.push(manual)

    // 先喜欢当前播放的推荐曲，再单曲点不再推荐
    changeSong('wy_1')
    session.applyFeedback('good')
    expect(session.sessionView.value.likedTracks).toHaveLength(1)

    session.dislikePathItem('wy_1')
    expect(session.sessionView.value.likedTracks).toEqual([])
    expect(session.sessionView.value.dislikedTracks).toEqual(expect.arrayContaining([{ artist: '周杰伦', title: '花海' }]))
    // 仅移除本会话推荐队列项，保留用户手动加入项
    expect(mocks.queue).toEqual([manual])
    expect(mocks.playNext).toHaveBeenCalledOnce()
  })

  it('陌生 ID 的繁简跨源换源（爱在西元前 → 愛在西元前）归并为同一条 played 路径并保留双源 ID 与来源徽章', async() => {
    setting['recommend.autoRefill'] = false
    const simplified = fusedItem('wy_xiyuan', '爱在西元前', '周杰伦')
    simplified.musicInfo.interval = '03:54'
    simplified.musicInfo.meta = { albumName: '范特西' } as any
    simplified.album = '范特西'
    mocks.platformRecall.mockResolvedValueOnce(recallOk([simplified]))
    await session.startSession()
    expect(session.sessionView.value.path).toHaveLength(1)

    // 切至陌生 ID 的繁体版本同录音
    mocks.player.musicInfo = {
      id: 'tx_xiyuan_trad',
      name: '愛在西元前',
      singer: '周杰倫',
      source: 'tx',
      interval: '03:54',
      meta: { albumName: '范特西' },
    }
    emitEvent('musicToggled', 'version')

    expect(session.sessionView.value.path).toHaveLength(1)
    expect(session.sessionView.value.path[0].state).toBe('played')
    expect(session.sessionView.value.path[0].recommendSources).toEqual([{ provider: 'wy', rank: 1 }])
    // 两个源 ID 都能定位到该路径条目
    session.playPathItem('wy_xiyuan')
    expect(mocks.playNow).toHaveBeenCalledTimes(1)
    session.playPathItem('tx_xiyuan_trad')
    expect(mocks.playNow).toHaveBeenCalledTimes(2)
  })

  it('召回途中切换 recommend.engine（→local）或改动全局代理（即使独立 YTM 代理启用）实时失效旧计划且 0 LLM', async() => {
    const scope = effectScope()
    try {
      scope.run(() => { session.initRecommendRadio() })
      await session.startSession()

      // 1) 独立 YTM 代理有效时改动全局代理 host 也必须失效在途计划
      setting['recommend.ytm.proxy.enable'] = true
      setting['recommend.ytm.proxy.host'] = '127.0.0.1'
      setting['recommend.ytm.proxy.port'] = '7890'
      await nextTick()
      await vi.advanceTimersByTimeAsync(1200)

      let releaseGlobalStale!: (v: ReturnType<typeof recallOk>) => void
      mocks.platformRecall.mockImplementationOnce(async() => new Promise(resolve => { releaseGlobalStale = resolve }))
      session.refillNow()
      await vi.waitFor(() => { expect(releaseGlobalStale).toBeDefined() })

      mocks.platformRecall.mockResolvedValueOnce(recallOk([fusedItem('wy_after_global_proxy', '新代理曲', '歌手')]))
      setting['network.proxy.enable'] = true
      setting['network.proxy.host'] = '10.0.0.2'
      setting['network.proxy.port'] = '8080'
      await nextTick()
      releaseGlobalStale(recallOk([fusedItem('wy_old_proxy', '旧代理曲', '旧歌手')]))
      await vi.advanceTimersByTimeAsync(1200)
      expect(session.sessionView.value.path.map(p => p.id)).not.toContain('wy_old_proxy')
      expect(session.sessionView.value.path.map(p => p.id)).toContain('wy_after_global_proxy')

      // 2) 召回途中切换引擎为 local：旧平台结果丢弃，新计划走 local 且 0 LLM
      let releaseEngineStale!: (v: ReturnType<typeof recallOk>) => void
      mocks.platformRecall.mockImplementationOnce(async() => new Promise(resolve => { releaseEngineStale = resolve }))
      session.refillNow()
      await vi.waitFor(() => { expect(releaseEngineStale).toBeDefined() })

      mocks.explore.mockResolvedValueOnce({
        engine: 'local',
        anchor: { artist: '周杰伦', title: '晴天', album: '' },
        position: '',
        featureSheet: {} as any,
        analysis: { summary: '', aiUsed: false, error: null },
        rawAnalysis: {} as any,
        candidates: [],
        meta: { sourceCounts: {}, recallError: null, aiRankError: null },
      })
      setting['recommend.engine'] = 'local'
      await nextTick()
      releaseEngineStale(recallOk([fusedItem('wy_stale_engine', '旧引擎曲', '旧歌手')]))
      await vi.advanceTimersByTimeAsync(1200)
      expect(session.sessionView.value.path.map(p => p.id)).not.toContain('wy_stale_engine')
      expect(mocks.explore).toHaveBeenCalledTimes(1)
      expect(mocks.llm).not.toHaveBeenCalled()
    } finally {
      scope.stop()
    }
  })

  it('R2 回归：local 切回 ai 时清空旧 analysisCache，后续 AI 续补不再误复用本地分析', async() => {
    const scope = effectScope()
    try {
      setting['recommend.engine'] = 'local'
      scope.run(() => { session.initRecommendRadio() })
      const fakeLocalAnalysis = { summary: 'local-only' } as any
      mocks.explore.mockResolvedValueOnce({
        engine: 'local',
        anchor: { artist: '周杰伦', title: '晴天', album: '' },
        position: '',
        featureSheet: {} as any,
        analysis: { summary: 'local', aiUsed: false, error: null },
        rawAnalysis: fakeLocalAnalysis,
        candidates: [{
          id: 'wy_l1',
          artist: '周杰伦',
          title: '花海',
          album: '魔杰座',
          reason: '本地推荐',
          journeyRole: 'open',
          musicInfo: { id: 'wy_l1', name: '花海', singer: '周杰伦', source: 'wy', interval: '04:00', meta: { albumName: '魔杰座' } } as any,
        }],
        meta: { sourceCounts: {}, recallError: null, aiRankError: null },
      })
      await session.startSession()
      expect(mocks.explore).toHaveBeenCalledTimes(1)

      mocks.explore.mockResolvedValueOnce({
        engine: 'ai',
        anchor: { artist: '周杰伦', title: '晴天', album: '' },
        position: '',
        featureSheet: {} as any,
        analysis: { summary: 'ai', aiUsed: true, error: null },
        rawAnalysis: { summary: 'ai-fresh' } as any,
        candidates: [],
        meta: { sourceCounts: {}, recallError: null, aiRankError: null },
      })
      setting['recommend.engine'] = 'ai'
      setting['ai.enable'] = true
      await nextTick()
      await vi.advanceTimersByTimeAsync(1200)

      expect(mocks.explore).toHaveBeenCalledTimes(2)
      const secondCallOpts = mocks.explore.mock.calls[1][0]
      expect(secondCallOpts.reuseAnalysis).toBeUndefined()
    } finally {
      scope.stop()
    }
  })

  it('R2 回归：换源试听（reason=user 但为同录音异源 ID）不触发短听跳过负反馈，且繁简反馈严格互斥', async() => {
    setting['recommend.autoRefill'] = false
    const simplified = fusedItem('wy_xiyuan', '爱在西元前', '周杰伦')
    simplified.musicInfo.interval = '03:54'
    simplified.musicInfo.meta = { albumName: '范特西' } as any
    simplified.album = '范特西'
    mocks.platformRecall.mockResolvedValueOnce(recallOk([simplified]))
    await session.startSession()

    // 播放简体推荐曲 5 秒后，经换源弹窗跨源试听（发出 reason='user'）切到繁体同录音异源 ID
    mocks.player.musicInfo = simplified.musicInfo
    emitEvent('musicToggled', 'user')
    emitEvent('play')
    await vi.advanceTimersByTimeAsync(5000)
    session.applyFeedback('good')
    expect(session.sessionView.value.likedTracks).toHaveLength(1)

    mocks.player.musicInfo = {
      id: 'tx_xiyuan_preview',
      name: '愛在西元前',
      singer: '周杰倫',
      source: 'tx',
      interval: '03:54',
      meta: { albumName: '范特西' },
    }
    emitEvent('musicToggled', 'user')

    // 绝不因换源试听误记短听跳过，也不多出重复路径行
    expect(mocks.recordSkip).not.toHaveBeenCalled()
    expect(session.sessionView.value.path).toHaveLength(1)

    // 在繁体同录音下点「不再推荐」必须清除简体「喜欢」记录（严格互斥）
    session.applyFeedback('dislike')
    expect(session.sessionView.value.likedTracks).toEqual([])
    expect(session.sessionView.value.dislikedTracks.length).toBeGreaterThanOrEqual(1)
  })

  it('R3 回归：空闲 AI 会话关闭自动续补时，编辑未启用的全局代理 host 不触发收费 AI 续补；dislikePathItem 不误切不同录音合作曲', async() => {
    const scope = effectScope()
    try {
      setting['recommend.engine'] = 'ai'
      setting['recommend.autoRefill'] = false
      setting['network.proxy.enable'] = false
      scope.run(() => { session.initRecommendRadio() })

      mocks.explore.mockResolvedValueOnce({
        engine: 'ai',
        anchor: { artist: '周杰伦', title: '晴天', album: '' },
        position: '',
        featureSheet: {} as any,
        analysis: { summary: 'ai', aiUsed: true, error: null },
        rawAnalysis: { summary: 'ai-cached' } as any,
        candidates: [{
          id: 'wy_ac',
          artist: '主唱A、合作者C',
          title: '同名曲',
          album: 'AlbumA',
          reason: 'AI推荐',
          journeyRole: 'open',
          musicInfo: { id: 'wy_ac', name: '同名曲', singer: '主唱A、合作者C', source: 'wy', interval: '03:00', meta: { albumName: 'AlbumA' } } as any,
        }],
        meta: { sourceCounts: {}, recallError: null, aiRankError: null },
      })
      await session.startSession()
      expect(mocks.explore).toHaveBeenCalledTimes(1)

      // 编辑未启用的全局代理 host：不得触发新的 AI exploreOnce 请求
      setting['network.proxy.host'] = '127.0.0.1'
      setting['network.proxy.port'] = '8080'
      await nextTick()
      await vi.advanceTimersByTimeAsync(1500)
      expect(mocks.explore).toHaveBeenCalledTimes(1)

      // 当前正在播放不同主艺人的同名合作曲（主唱B、合作者C）：对路径项 wy_ac 点不再推荐不得调用 playNext 误切当前播放曲
      mocks.player.musicInfo = {
        id: 'tx_bc',
        name: '同名曲',
        singer: '主唱B、合作者C',
        source: 'tx',
        interval: '03:50',
        meta: { albumName: 'AlbumB' },
      }
      session.dislikePathItem('wy_ac')
      expect(mocks.playNext).not.toHaveBeenCalled()
    } finally {
      scope.stop()
    }
  })
})
