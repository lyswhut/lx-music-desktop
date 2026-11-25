import { describe, expect, it, vi } from 'vitest'
import { LIST_IDS } from '@common/constants'
import { reactive } from '@common/utils/vueTools'
import { CatalogError } from './adapter'
import { createCatalogState } from './controller'
import {
  MAX_CATALOG_PLAY_ALL_PAGES,
  appendUniqueToQueueSession,
  createCatalogPlayback,
  getCatalogTempListId,
  type QueueSessionLike,
} from './playback'
import { type CatalogPage, type CatalogTarget } from './types'

const song = (id: string): LX.Music.MusicInfoOnline => ({
  id,
  source: 'wy',
  name: id,
  singer: 'Artist',
  interval: null,
  meta: { songId: id, albumName: 'Album', qualitys: [], _qualitys: {} },
})

const target: CatalogTarget = { kind: 'artist', source: 'wy', id: 6452, name: '周杰伦' }
const targetB: CatalogTarget = { kind: 'album', source: 'tx', id: 'alb-b', name: '叶惠美' }

const createOwnerTracker = () => {
  let gen = 0
  return {
    capture: () => {
      const captured = gen
      return () => captured === gen
    },
    steal: () => { gen++ },
  }
}

describe('catalog playback (LIST_IDS.TEMP full-queue & play-all)', () => {
  it('playAt 将完整目录剥离 Vue Proxy 后写入 LIST_IDS.TEMP（可通过 structuredClone）并以 pauseRadio 起播', async() => {
    const state = reactive(createCatalogState())
    state.show = true
    state.target = target
    state.list = [song('s0'), song('s1'), song('s2'), song('s3')]
    state.page = 1
    state.limit = 50
    state.hasMore = false

    let activeTempId: string | null = null
    let playerListId: string | null = null
    const owner = createOwnerTracker()
    const setTempList = vi.fn(async(id: string, list: LX.Music.MusicInfoOnline[]) => {
      expect(() => structuredClone(list)).not.toThrow()
      activeTempId = id
    })
    const playList = vi.fn((listId: string) => { playerListId = listId })

    const playback = createCatalogPlayback({
      state,
      adapter: { load: vi.fn() },
      setTempList,
      playList,
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
    })

    const ok = await playback.playAt(2)
    expect(ok).toBe(true)
    expect(setTempList).toHaveBeenCalledWith(getCatalogTempListId(target), expect.any(Array))
    expect(setTempList.mock.calls[0][1].map(s => s.id)).toEqual(['s0', 's1', 's2', 's3'])
    expect(playList).toHaveBeenCalledWith(LIST_IDS.TEMP, 2, { pauseRadio: true })
  })

  it('playAt 等待 setTempList 期间若用户切播其他列表，绝不抢回播放权', async() => {
    const state = reactive(createCatalogState())
    state.show = true
    state.target = target
    state.list = [song('s0'), song('s1')]

    let resolveWrite!: () => void
    const writeGate = new Promise<void>(resolve => { resolveWrite = resolve })
    let activeTempId: string | null = null
    let playerListId: string | null = null
    const owner = createOwnerTracker()
    const setTempList = vi.fn(async(id: string) => {
      await writeGate
      activeTempId = id
    })
    const playList = vi.fn((listId: string) => { playerListId = listId })

    const playback = createCatalogPlayback({
      state,
      adapter: { load: vi.fn() },
      setTempList,
      playList,
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
    })

    const pending = playback.playAt(1)
    await vi.waitFor(() => {
      expect(setTempList).toHaveBeenCalledTimes(1)
    })
    owner.steal()
    playerListId = LIST_IDS.DEFAULT
    resolveWrite()

    const ok = await pending
    expect(ok).toBe(false)
    expect(playList).not.toHaveBeenCalled()
  })

  it('playAll 立即从第 0 首起播并后台续拉剩余分页加入临时播放列表；上限 10 页且切走队列立即停止', async() => {
    const state = reactive(createCatalogState())
    state.show = true
    state.target = target
    state.list = [song('p1-1'), song('p1-2')]
    state.page = 1
    state.limit = 2
    state.total = 5
    state.hasMore = true

    let activeTempId: string | null = null
    let playerListId: string | null = null
    const owner = createOwnerTracker()
    const savedSnapshots: LX.Music.MusicInfoOnline[][] = []
    const setTempList = vi.fn(async(id: string, list: LX.Music.MusicInfoOnline[]) => {
      expect(() => structuredClone(list)).not.toThrow()
      activeTempId = id
      savedSnapshots.push(list)
    })
    const playList = vi.fn((listId: string) => { playerListId = listId })
    const load = vi.fn<(t: CatalogTarget, page?: number, limit?: number) => Promise<CatalogPage>>()
      .mockResolvedValueOnce({ list: [song('p2-1'), song('p2-2')], page: 2, limit: 2, total: 5, hasMore: true })
      .mockResolvedValueOnce({ list: [song('p3-1')], page: 3, limit: 2, total: 5, hasMore: false })

    const playback = createCatalogPlayback({
      state,
      adapter: { load },
      setTempList,
      playList,
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
    })

    const ok = await playback.playAll()
    expect(ok).toBe(true)
    expect(playList).toHaveBeenCalledTimes(1)
    expect(playList).toHaveBeenCalledWith(LIST_IDS.TEMP, 0, { pauseRadio: true })
    expect(load).toHaveBeenCalledTimes(2)
    expect(savedSnapshots[savedSnapshots.length - 1].map(s => s.id)).toEqual(['p1-1', 'p1-2', 'p2-1', 'p2-2', 'p3-1'])
    expect(state.list.map(s => s.id)).toEqual(['p1-1', 'p1-2', 'p2-1', 'p2-2', 'p3-1'])
    expect(state.hasMore).toBe(false)

    // 验证 MAX_CATALOG_PLAY_ALL_PAGES = 10 上限
    state.list = [song('cap-p1')]
    state.page = 1
    state.limit = 1
    state.hasMore = true
    const capLoad = vi.fn(async(_t: CatalogTarget, page = 1): Promise<CatalogPage> => ({
      list: [song(`cap-p${page}`)],
      page,
      limit: 1,
      total: 99,
      hasMore: true,
    }))
    const capPlayback = createCatalogPlayback({
      state,
      adapter: { load: capLoad },
      setTempList: vi.fn(async(id: string) => { activeTempId = id }),
      playList: (id) => { playerListId = id },
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
    })
    await capPlayback.playAll()
    expect(capLoad).toHaveBeenCalledTimes(10)
    expect(MAX_CATALOG_PLAY_ALL_PAGES).toBe(10)

    // 用户切走当前播放列表时，后续分页不再续拉
    state.list = [song('q1')]
    state.page = 1
    state.hasMore = true
    const load2 = vi.fn(async() => {
      playerListId = LIST_IDS.DEFAULT
      return { list: [song('q2')], page: 2, limit: 1, total: 3, hasMore: true }
    })
    const setTempList2 = vi.fn(async(id: string) => { activeTempId = id })
    const playback2 = createCatalogPlayback({
      state,
      adapter: { load: load2 },
      setTempList: setTempList2,
      playList: (id) => { playerListId = id },
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
    })
    await playback2.playAll()
    expect(load2).toHaveBeenCalledTimes(1)
    expect(setTempList2).toHaveBeenCalledTimes(1)
  })

  it('playAll 与手动加载更多并发完成第 2 页时，不误报无新歌曲且自动续拉第 3 页', async() => {
    const state = reactive(createCatalogState())
    state.show = true
    state.target = target
    state.list = [song('p1')]
    state.page = 1
    state.limit = 1
    state.total = 3
    state.hasMore = true

    let resolvePage2!: (p: CatalogPage) => void
    let activeTempId: string | null = null
    let playerListId: string | null = null
    const owner = createOwnerTracker()
    const committed: string[][] = []

    const load = vi.fn<(t: CatalogTarget, page?: number, limit?: number) => Promise<CatalogPage>>()
      .mockImplementationOnce(async() => new Promise(resolve => { resolvePage2 = resolve }))
      .mockResolvedValueOnce({ list: [song('p3')], page: 3, limit: 1, total: 3, hasMore: false })

    const playback = createCatalogPlayback({
      state,
      adapter: { load },
      setTempList: vi.fn(async(id: string, list: LX.Music.MusicInfoOnline[]) => {
        activeTempId = id
        committed.push(list.map(s => s.id))
      }),
      playList: (id) => { playerListId = id },
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
    })

    const pending = playback.playAll()
    await vi.waitFor(() => {
      expect(load).toHaveBeenCalledTimes(1)
    })

    // 模拟手动「加载更多」抢先完成第 2 页并同步进 TEMP 队列
    state.list = [song('p1'), song('p2')]
    state.page = 2
    playback.syncAppendedPage(target, [song('p2')])
    await vi.waitFor(() => {
      expect(committed).toHaveLength(2)
    })

    // 随后 playAll 自己的第 2 页响应到达
    resolvePage2({ list: [song('p2')], page: 2, limit: 1, total: 3, hasMore: true })
    await pending

    expect(state.error).toBe('')
    expect(load).toHaveBeenCalledTimes(2)
    expect(committed[committed.length - 1]).toEqual(['p1', 'p2', 'p3'])
    expect(state.list.map(s => s.id)).toEqual(['p1', 'p2', 'p3'])
  })

  it('playAll 后台拉取第 3 页期间关闭并重开同目录（弹窗回到第 1 页），不跳页拼出 [p1, p3] 缺洞', async() => {
    const state = reactive(createCatalogState())
    state.show = true
    state.target = target
    state.list = [song('p1')]
    state.page = 1
    state.limit = 1
    state.total = 3
    state.hasMore = true

    let resolvePage3!: (p: CatalogPage) => void
    let activeTempId: string | null = null
    let playerListId: string | null = null
    const owner = createOwnerTracker()
    const committed: string[][] = []

    const load = vi.fn<(t: CatalogTarget, page?: number, limit?: number) => Promise<CatalogPage>>()
      .mockResolvedValueOnce({ list: [song('p2')], page: 2, limit: 1, total: 3, hasMore: true })
      .mockImplementationOnce(async() => new Promise(resolve => { resolvePage3 = resolve }))

    const playback = createCatalogPlayback({
      state,
      adapter: { load },
      setTempList: vi.fn(async(id: string, list: LX.Music.MusicInfoOnline[]) => {
        activeTempId = id
        committed.push(list.map(s => s.id))
      }),
      playList: (id) => { playerListId = id },
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
    })

    const pending = playback.playAll()
    await vi.waitFor(() => {
      expect(load).toHaveBeenCalledTimes(2)
    })

    // 关闭并重开同目录，弹窗仅加载第 1 页
    state.list = [song('p1')]
    state.page = 1
    state.hasMore = true

    resolvePage3({ list: [song('p3')], page: 3, limit: 1, total: 3, hasMore: false })
    await pending

    // TEMP 播放队列完整包含 [p1, p2, p3]
    expect(committed[committed.length - 1]).toEqual(['p1', 'p2', 'p3'])
    // 重开后的弹窗停留在第 1 页，未被第 3 页跳页污染成 [p1, p3]
    expect(state.page).toBe(1)
    expect(state.hasMore).toBe(true)
    expect(state.list.map(s => s.id)).toEqual(['p1'])
  })

  it('playAll 在等待 setTempList 期间切换弹窗到目录 B，仍隔离续拉目录 A 且不污染目录 B 的弹窗状态', async() => {
    const state = reactive(createCatalogState())
    state.show = true
    state.target = target
    state.list = [song('a1')]
    state.page = 1
    state.limit = 1
    state.total = 2
    state.hasMore = true

    let resolveInitialWrite!: () => void
    const initialWriteGate = new Promise<void>(resolve => { resolveInitialWrite = resolve })
    let activeTempId: string | null = null
    let playerListId: string | null = null
    const owner = createOwnerTracker()
    const writtenIds: string[][] = []
    const setTempList = vi.fn(async(id: string, list: LX.Music.MusicInfoOnline[]) => {
      if (writtenIds.length === 0) {
        await initialWriteGate
      }
      activeTempId = id
      writtenIds.push(list.map(s => s.id))
    })
    const load = vi.fn(async(t: CatalogTarget, page = 1): Promise<CatalogPage> => ({
      list: [song(`${t.id}-p${page}`)],
      page,
      limit: 1,
      total: 2,
      hasMore: false,
    }))

    const playback = createCatalogPlayback({
      state,
      adapter: { load },
      setTempList,
      playList: (listId) => { playerListId = listId },
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
    })

    const playAllPromise = playback.playAll()
    await vi.waitFor(() => {
      expect(setTempList).toHaveBeenCalledTimes(1)
    })
    state.target = targetB
    state.list = [song('b1'), song('b2')]
    state.page = 1
    state.hasMore = false
    resolveInitialWrite()

    const ok = await playAllPromise
    expect(ok).toBe(true)
    expect(load).toHaveBeenCalledWith(target, 2, 1)
    expect(writtenIds).toEqual([['a1'], ['a1', '6452-p2']])
    expect(state.target).toEqual(targetB)
    expect(state.list.map(s => s.id)).toEqual(['b1', 'b2'])
  })

  it('syncAppendedPage 通过生产版 appendUniqueToQueueSession 保持用户重排顺序并递增 revision', async() => {
    const state = reactive(createCatalogState())
    state.show = true
    state.target = target
    state.list = [song('s0'), song('s1')]
    state.page = 1
    state.hasMore = true

    let activeTempId: string | null = null
    let playerListId: string | null = null
    const session: QueueSessionLike = {
      listId: LIST_IDS.TEMP,
      list: [song('s0'), song('s1')],
      revision: 0,
    }
    const owner = createOwnerTracker()
    const tempHistory: string[][] = []

    const playback = createCatalogPlayback({
      state,
      adapter: { load: vi.fn() },
      setTempList: vi.fn(async(id: string, list: LX.Music.MusicInfoOnline[]) => {
        activeTempId = id
        tempHistory.push(list.map(s => s.id))
      }),
      playList: (listId) => { playerListId = listId },
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
      appendToQueueSession: (additions) => {
        appendUniqueToQueueSession(session, additions)
      },
    })

    expect(await playback.playAt(0)).toBe(true)
    session.list = [song('s1'), song('s0')]

    playback.syncAppendedPage(target, [song('s2'), song('s3')])
    playback.syncAppendedPage(target, [song('s2'), song('s4')])
    await vi.waitFor(() => {
      expect(tempHistory).toHaveLength(3)
    })

    expect(tempHistory).toEqual([
      ['s0', 's1'],
      ['s0', 's1', 's2', 's3'],
      ['s0', 's1', 's2', 's3', 's4'],
    ])
    expect(session.list.map(s => s.id)).toEqual(['s1', 's0', 's2', 's3', 's4'])
    expect(session.revision).toBe(2)

    // 直接验证 appendUniqueToQueueSession 自身的既有 ID 与批内重复 ID 去重
    expect(appendUniqueToQueueSession(session, [song('s1'), song('s5'), song('s5'), song('s6')])).toBe(true)
    expect(session.list.map(s => s.id)).toEqual(['s1', 's0', 's2', 's3', 's4', 's5', 's6'])
    expect(session.revision).toBe(3)
  })

  it('playAll 合并手动页期间切换弹窗到目录 B 时冻结原目录游标继续续拉；开启电台（isSelectionQueue=false）立即停止续拉', async() => {
    const state = reactive(createCatalogState())
    state.show = true
    state.target = target
    state.list = [song('a1')]
    state.page = 1
    state.limit = 1
    state.total = 4
    state.hasMore = true

    let resolveInitialWrite!: () => void
    const initialGate = new Promise<void>(resolve => { resolveInitialWrite = resolve })
    let resolveMergeWrite!: () => void
    const mergeGate = new Promise<void>(resolve => { resolveMergeWrite = resolve })
    let activeTempId: string | null = null
    let playerListId: string | null = null
    let writeCount = 0
    const owner = createOwnerTracker()
    const committed: string[][] = []

    const setTempList = vi.fn(async(id: string, list: LX.Music.MusicInfoOnline[]) => {
      writeCount++
      if (writeCount === 1) await initialGate
      else if (writeCount === 2) await mergeGate
      activeTempId = id
      committed.push(list.map(s => s.id))
    })
    const load = vi.fn(async(t: CatalogTarget, page = 1): Promise<CatalogPage> => ({
      list: [song(`${t.id}-p${page}`)],
      page,
      limit: 1,
      total: 4,
      hasMore: page < 4,
    }))

    const playback = createCatalogPlayback({
      state,
      adapter: { load },
      setTempList,
      playList: (listId) => { playerListId = listId },
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
    })

    const pending = playback.playAll()
    await vi.waitFor(() => { expect(setTempList).toHaveBeenCalledTimes(1) })
    // 手动加载第 2 页完成（进入 modal 合并分支）
    state.list = [song('a1'), song('a2')]
    state.page = 2
    state.hasMore = true
    resolveInitialWrite()

    // 等待进入合并分支的第 2 次 setTempList 后，立即切弹窗到单页目录 B
    await vi.waitFor(() => { expect(setTempList).toHaveBeenCalledTimes(2) })
    state.target = targetB
    state.list = [song('b1')]
    state.page = 1
    state.hasMore = false
    resolveMergeWrite()

    await pending
    // 合并前已冻结目录 A 的 page=2/hasMore=true，故继续续拉 A 的第 3、4 页且不污染 B
    expect(load).toHaveBeenCalledWith(target, 3, 1)
    expect(load).toHaveBeenCalledWith(target, 4, 1)
    expect(committed[committed.length - 1]).toEqual(['a1', 'a2', '6452-p3', '6452-p4'])
    expect(state.target).toEqual(targetB)

    // 播放期间用户点播放栏「开始电台」使 isSelectionQueue 变 false，立即停止续拉
    let selectionQueue = true
    state.target = target
    state.list = [song('r1')]
    state.page = 1
    state.hasMore = true
    const radioLoad = vi.fn(async(): Promise<CatalogPage> => {
      selectionQueue = false
      return { list: [song('r2')], page: 2, limit: 1, total: 3, hasMore: true }
    })
    const radioSetTemp = vi.fn(async(id: string) => { activeTempId = id })
    const radioPlayback = createCatalogPlayback({
      state,
      adapter: { load: radioLoad },
      setTempList: radioSetTemp,
      playList: (listId) => { playerListId = listId },
      getTempListId: () => activeTempId,
      getPlayerListId: () => playerListId,
      isSelectionQueue: () => selectionQueue,
      capturePlaybackOwner: owner.capture,
      assertPlaybackSupport: () => true,
    })
    await radioPlayback.playAll()
    expect(radioLoad).toHaveBeenCalledTimes(1)
    expect(radioSetTemp).toHaveBeenCalledTimes(1)
  })

  it('setTempList 连续两次失败时 retry 返回 handled=true 且保留错误，第 3 次重试成功；clearRetry 防止加载失败误重放；第 2 页写入失败重试可续拉第 3 页', async() => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const state = reactive(createCatalogState())
      state.show = true
      state.target = target
      state.list = [song('s0'), song('s1')]
      state.page = 1
      state.limit = 2
      state.hasMore = true

      let activeTempId: string | null = null
      let playerListId: string | null = null
      const owner = createOwnerTracker()
      const playList = vi.fn((listId: string) => { playerListId = listId })
      const setTempList = vi.fn()
        .mockRejectedValueOnce(new Error('IPC failed #1'))
        .mockRejectedValueOnce(new Error('IPC failed #2'))
        .mockImplementationOnce(async(id: string) => { activeTempId = id })

      const playback = createCatalogPlayback({
        state,
        adapter: { load: vi.fn() },
        setTempList,
        playList,
        getTempListId: () => activeTempId,
        getPlayerListId: () => playerListId,
        capturePlaybackOwner: owner.capture,
        assertPlaybackSupport: () => true,
      })

      expect(await playback.playAt(1)).toBe(false)
      expect(state.error).toBe('Catalog playback failed')

      // 第二次依然失败：handled 必须为 true，防止 retryCatalogAction 误穿透到 loadMore
      expect(await playback.retry()).toEqual({ handled: true, succeeded: false })
      expect(state.error).toBe('Catalog playback failed')
      expect(playList).not.toHaveBeenCalled()

      // 第三次重试成功并清除错误态
      expect(await playback.retry()).toEqual({ handled: true, succeeded: true })
      expect(state.error).toBe('')
      expect(playList).toHaveBeenCalledWith(LIST_IDS.TEMP, 1, { pauseRadio: true })

      // 控制器触发加载/重置后 clearRetry，再调用 retry 返回 handled=false
      setTempList.mockRejectedValueOnce(new Error('IPC failed #4'))
      expect(await playback.playAt(0)).toBe(false)
      playback.clearRetry()
      expect(await playback.retry()).toEqual({ handled: false, succeeded: false })

      // playAll 第 2 页写入失败后点重试，补写第 2 页并续拉第 3 页
      state.list = [song('p1')]
      state.page = 1
      state.limit = 1
      state.total = 3
      state.hasMore = true
      const p2Snapshots: string[][] = []
      const p2SetTemp = vi.fn()
        .mockImplementationOnce(async(id: string, list: LX.Music.MusicInfoOnline[]) => { activeTempId = id; p2Snapshots.push(list.map(s => s.id)) })
        .mockRejectedValueOnce(new Error('page2 IPC failed'))
        .mockImplementation(async(id: string, list: LX.Music.MusicInfoOnline[]) => { activeTempId = id; p2Snapshots.push(list.map(s => s.id)) })
      const p2Load = vi.fn<(t: CatalogTarget, page?: number, limit?: number) => Promise<CatalogPage>>()
        .mockResolvedValueOnce({ list: [song('p2')], page: 2, limit: 1, total: 3, hasMore: true })
        .mockResolvedValueOnce({ list: [song('p3')], page: 3, limit: 1, total: 3, hasMore: false })
      const p2Playback = createCatalogPlayback({
        state,
        adapter: { load: p2Load },
        setTempList: p2SetTemp,
        playList: (listId) => { playerListId = listId },
        getTempListId: () => activeTempId,
        getPlayerListId: () => playerListId,
        capturePlaybackOwner: owner.capture,
        assertPlaybackSupport: () => true,
      })
      expect(await p2Playback.playAll()).toBe(true)
      expect(state.error).toBe('Catalog playback failed')
      expect(await p2Playback.retry()).toEqual({ handled: true, succeeded: true })
      expect(state.error).toBe('')
      expect(p2Snapshots[p2Snapshots.length - 1]).toEqual(['p1', 'p2', 'p3'])
      expect(state.list.map(s => s.id)).toEqual(['p1', 'p2', 'p3'])
      expect(state.hasMore).toBe(false)

      // 后台续拉遇到 CatalogError 时，保留起播成功结果并展示错误信息
      state.list = [song('s0')]
      state.page = 1
      state.hasMore = true
      const bgFailPlayback = createCatalogPlayback({
        state,
        adapter: {
          load: vi.fn(async() => {
            throw new CatalogError('response', '目录分页响应异常')
          }),
        },
        setTempList: vi.fn(async(id: string) => { activeTempId = id }),
        playList: (listId) => { playerListId = listId },
        getTempListId: () => activeTempId,
        getPlayerListId: () => playerListId,
        capturePlaybackOwner: owner.capture,
        assertPlaybackSupport: () => true,
      })

      expect(await bgFailPlayback.playAll()).toBe(true)
      expect(state.error).toBe('目录分页响应异常')
    } finally {
      errSpy.mockRestore()
    }
  })
})
