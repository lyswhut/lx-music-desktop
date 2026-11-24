/**
 * 探索会话状态机的纯逻辑测试（T-B2）。
 *
 * 覆盖：半径加减界、艺人去重、remaining 阈值、path 追加顺序、反馈后的续补指令拼接；
 * TT-1 新增：切歌判定（decideOnSongChange）、重锚继承边界（reanchorSession）、连续失败收台计数；
 * TT-2/TT-4 新增：约束作废判定与收台重开边界（analysisStale、全新 run），播放时长累计器
 * （accumulatePlayTime/readPlayedMs）与本地指标（reduceMetrics/hydrateMetrics）。
 * 会话编排（session.ts，依赖播放器/事件/引擎）不在本文件测试范围，见 T-B2 报告。
 */
import { describe, expect, it } from 'vitest'
import { negativeFromInstruction } from './judgment'
import {
  PLAN_FAILURE_LIMIT,
  RADIUS_DEFAULT,
  RADIUS_MAX,
  RADIUS_MIN,
  SKIP_JUDGE_SECONDS,
  START_RADIO_DEBOUNCE_MS,
  accumulatePlayTime,
  addRecommendedIds,
  analysisStale,
  appendToPath,
  applyFeedback,
  batchKey,
  buildReplanInstruction,
  clampRadius,
  computeRefillNeed,
  createMetricsState,
  createPlayTimeState,
  createSession,
  decideOnSongChange,
  groupPathByBatch,
  hydrateMetrics,
  readPlayedMs,
  reanchorSession,
  recordPlanFailure,
  recordPlanSuccess,
  reduceMetrics,
  shouldEndRun,
  toView,
  updateInstruction,
  updateRadius,
} from './session-core'
import type { MetricsEvent, MetricsState, PathBatch, PlayTimeState, SessionAnchor, SessionState } from './session-core'

const anchor: SessionAnchor = {
  id: 'anchor-1',
  artist: '陈奕迅',
  title: '富士山下',
  album: "What's Going On…?",
  pic: 'https://example.com/pic.jpg',
}

const create = (): SessionState => createSession(anchor)

const sourceInfo = (id: string, singer: string, name: string = 'Song'): LX.Music.MusicInfoOnline => ({
  id, singer, name, source: 'wy', interval: null, meta: { songId: id, albumName: '', qualitys: [], _qualitys: {} },
})

const plannedItem = (id: string, artist: string, title: string) => ({
  id,
  artist,
  title,
  album: '',
  reason: '它接住了起点没有说完的那一部分',
  journeyRole: 'open',
  state: 'planned' as const,
})

describe('clampRadius - 探索距离边界', () => {
  it('小于下限的值收敛到 10', () => {
    // act & assert
    expect(clampRadius(0)).toBe(RADIUS_MIN)
    expect(clampRadius(-5)).toBe(RADIUS_MIN)
  })

  it('大于上限的值收敛到 90', () => {
    // act & assert
    expect(clampRadius(100)).toBe(RADIUS_MAX)
    expect(clampRadius(120)).toBe(RADIUS_MAX)
  })

  it('范围内的值保持不变', () => {
    // act & assert
    expect(clampRadius(35)).toBe(35)
    expect(clampRadius(10)).toBe(10)
    expect(clampRadius(90)).toBe(90)
  })

  it('非数值回退默认 35', () => {
    // act & assert
    expect(clampRadius(Number.NaN)).toBe(RADIUS_DEFAULT)
  })
})

describe('createSession - 创建会话', () => {
  it('默认半径 35，反馈列表与前提交为空，active 为 true', () => {
    // act
    const state = create()
    // assert
    expect(state.active).toBe(true)
    expect(state.radius).toBe(RADIUS_DEFAULT)
    expect(state.anchor).toEqual(anchor)
    expect(state.instruction).toBe('')
    expect(state.positiveArtists).toEqual([])
    expect(state.negativeArtists).toEqual([])
    expect(state.recommendedIds).toEqual([])
    expect(state.path).toEqual([])
  })

  it('支持自定义初始半径与指令', () => {
    // act
    const state = createSession(anchor, { radius: 60, instruction: '更冷一点' })
    // assert
    expect(state.radius).toBe(60)
    expect(state.instruction).toBe('更冷一点')
  })
})

describe('updateRadius/updateInstruction - 滑杆与约束更新', () => {
  it('更新半径时按 10-90 收敛', () => {
    // act
    const state = updateRadius(create(), 5)
    // assert
    expect(state.radius).toBe(RADIUS_MIN)
  })

  it('更新指令后原样保留', () => {
    // act
    const state = updateInstruction(create(), '不要华语')
    // assert
    expect(state.instruction).toBe('不要华语')
  })
})

describe('applyFeedback - 反馈转移', () => {
  it('far：半径减 8（下限 10），当前艺人进入 negativeArtists', () => {
    // act
    const state = applyFeedback(create(), 'far', '陈奕迅')
    // assert
    expect(state.radius).toBe(RADIUS_DEFAULT - 8)
    expect(state.negativeArtists).toEqual(['陈奕迅'])
    expect(state.positiveArtists).toEqual([])
  })

  it('far 反复应用：半径不越过下限 10', () => {
    // arrange
    let state = createSession(anchor, { radius: 12 })
    // act
    state = applyFeedback(state, 'far', '陈奕迅')
    state = applyFeedback(state, 'far', 'Michael Jackson')
    // assert
    expect(state.radius).toBe(RADIUS_MIN)
  })

  it('good：半径不变，当前艺人进入 positiveArtists', () => {
    // act
    const state = applyFeedback(create(), 'good', '陈奕迅')
    // assert
    expect(state.radius).toBe(RADIUS_DEFAULT)
    expect(state.positiveArtists).toEqual(['陈奕迅'])
    expect(state.negativeArtists).toEqual([])
  })

  it('同一艺人重复反馈只保留一条（去重）', () => {
    // act
    let state = create()
    state = applyFeedback(state, 'far', 'Adele')
    state = applyFeedback(state, 'far', 'Adele')
    state = applyFeedback(state, 'good', 'Adele')
    state = applyFeedback(state, 'good', 'Adele')
    // assert
    expect(state.negativeArtists).toEqual(['Adele'])
    expect(state.positiveArtists).toEqual(['Adele'])
  })

  it('反馈不影响 path 与 recommendedIds（不跳过当前歌）', () => {
    // arrange
    let state = create()
    state = addRecommendedIds(state, ['r1'])
    state = appendToPath(state, plannedItem('r1', 'Adele', 'Hello'))
    // act
    state = applyFeedback(state, 'far', 'Adele')
    // assert
    expect(state.path).toHaveLength(1)
    expect(state.path[0].state).toBe('planned')
    expect(state.recommendedIds).toEqual(['r1'])
  })
})

describe('computeRefillNeed - 队列剩余阈值', () => {
  it('剩余 3 首时触发续补（<=3）', () => {
    // act & assert
    expect(computeRefillNeed(['a', 'b', 'c'])).toBe(true)
  })

  it('剩余 4 首时不触发', () => {
    // act & assert
    expect(computeRefillNeed(['a', 'b', 'c', 'd'])).toBe(false)
  })

  it('剩余 0 首（队列被清空）时触发', () => {
    // act & assert
    expect(computeRefillNeed([])).toBe(true)
  })

  it('阈值可自定义', () => {
    // act & assert
    expect(computeRefillNeed(['a', 'b', 'c', 'd'], 4)).toBe(true)
    expect(computeRefillNeed(['a', 'b', 'c', 'd'], 3)).toBe(false)
  })
})

describe('addRecommendedIds - 推荐 id 集合', () => {
  it('追加并去重', () => {
    // act
    let state = create()
    state = addRecommendedIds(state, ['r1', 'r2'])
    state = addRecommendedIds(state, ['r2', 'r3'])
    // assert
    expect(state.recommendedIds).toEqual(['r1', 'r2', 'r3'])
  })
})

describe('appendToPath - 路径追加顺序', () => {
  it('按听过的顺序追加，state 为 played', () => {
    // arrange
    let state = create()
    state = appendToPath(state, { ...plannedItem('r1', 'Adele', 'Hello'), state: 'played' })
    state = appendToPath(state, { ...plannedItem('r2', 'Coldplay', 'Yellow'), state: 'played' })
    // assert
    expect(state.path.map(p => p.id)).toEqual(['r1', 'r2'])
    expect(state.path.every(p => p.state === 'played')).toBe(true)
  })

  it('同一 id 只保留一条（planned 更新为 played，位置不变）', () => {
    // arrange
    let state = create()
    state = appendToPath(state, plannedItem('r1', 'Adele', 'Hello'))
    // act
    state = appendToPath(state, { ...plannedItem('r1', 'Adele', 'Hello'), state: 'played' })
    // assert
    expect(state.path).toHaveLength(1)
    expect(state.path[0].state).toBe('played')
  })

  it('无 id 条目（历史兼容）按追加处理', () => {
    // arrange
    let state = create()
    // act
    state = appendToPath(state, { ...plannedItem('', 'Adele', 'Hello'), id: null, state: 'played' })
    // assert
    expect(state.path).toHaveLength(1)
  })

  it('同曲不同 id 变体合并为一条（位置不变，字段取后来传入的 item）', () => {
    // arrange（同一首歌两个平台变体：artist 串顺序不同、id 不同）
    let state = create()
    state = appendToPath(state, plannedItem('r1', 'mpi, Laco, Benjamin, 薄野弘之', 'Möbius'))
    state = appendToPath(state, plannedItem('r1-other', 'Adele', 'Hello'))
    // act
    state = appendToPath(state, plannedItem('r2', 'Benjamin, Laco, 薄野弘之', 'Möbius'))
    // assert（Möbius 变体合并为一条且位置不变，字段取后来传入的 item）
    expect(state.path).toHaveLength(2)
    expect(state.path[0].id).toBe('r2')
    expect(state.path[0].artist).toBe('Benjamin, Laco, 薄野弘之')
    expect(state.path[1].id).toBe('r1-other')
  })

  it('不同曲照常追加两条', () => {
    // arrange
    let state = create()
    // act
    state = appendToPath(state, plannedItem('r1', 'Adele', 'Hello'))
    state = appendToPath(state, plannedItem('r2', 'Coldplay', 'Yellow'))
    // assert
    expect(state.path.map(p => p.id)).toEqual(['r1', 'r2'])
  })
})

describe('appendToPath - batch 快照继承/合并', () => {
  const batch = { radius: 35, instruction: '更冷一点', engine: 'ai' as const }

  it('新增条目携带 batch', () => {
    // act
    const state = appendToPath(create(), { ...plannedItem('r1', 'Adele', 'Hello'), batch })
    // assert
    expect(state.path[0].batch).toEqual(batch)
  })

  it('played 更新（不带 batch）继承既有条目的 batch', () => {
    // arrange
    let state = appendToPath(create(), { ...plannedItem('r1', 'Adele', 'Hello'), batch })
    // act：切歌回写 played 不带 batch（旧行为不改动其他字段）
    state = appendToPath(state, { ...plannedItem('r1', 'Adele', 'Hello'), state: 'played' })
    // assert
    expect(state.path[0].state).toBe('played')
    expect(state.path[0].batch).toEqual(batch)
  })

  it('同曲合并时显式传入 batch 用新值（handleMusicToggled 语义，保留原批次）', () => {
    // arrange
    let state = appendToPath(create(), { ...plannedItem('r1', 'Adele', 'Hello'), batch })
    // act：切歌回写 played 时把既有 batch 显式带回
    state = appendToPath(state, { ...plannedItem('r1', 'Adele', 'Hello'), state: 'played', batch: state.path[0].batch })
    // assert
    expect(state.path[0].state).toBe('played')
    expect(state.path[0].batch).toEqual(batch)
  })

  it('同曲合并时新 batch 覆盖既有 batch', () => {
    // arrange
    let state = appendToPath(create(), { ...plannedItem('r1', 'Adele', 'Hello'), batch })
    const nextBatch = { radius: 20, instruction: '', engine: 'local' as const }
    // act
    state = appendToPath(state, { ...plannedItem('r1', 'Adele', 'Hello'), state: 'planned', batch: nextBatch })
    // assert
    expect(state.path).toHaveLength(1)
    expect(state.path[0].batch).toEqual(nextBatch)
  })
})

describe('batchKey / groupPathByBatch - 路径批次分组', () => {
  const batchA: PathBatch = { radius: 35, instruction: '更冷一点', engine: 'ai' }
  const batchB: PathBatch = { radius: 20, instruction: '', engine: 'local' }

  it('batchKey：同值批次 key 相同，异值 key 不同', () => {
    // act & assert
    expect(batchKey(batchA)).toBe(batchKey({ ...batchA }))
    expect(batchKey(batchA)).not.toBe(batchKey(batchB))
  })

  it('batchKey：无批次（null/undefined）→ null', () => {
    // act & assert
    expect(batchKey(null)).toBeNull()
    expect(batchKey(undefined)).toBeNull()
  })

  it('连续相同批次归一组，批次变化开新组（组内保持原顺序）', () => {
    // act
    const groups = groupPathByBatch([
      { id: 'a1', batch: batchA },
      { id: 'a2', batch: batchA },
      { id: 'b1', batch: batchB },
    ])
    // assert
    expect(groups.map(g => g.batch)).toEqual([batchA, batchB])
    expect(groups[0].items.map(i => i.id)).toEqual(['a1', 'a2'])
    expect(groups[1].items.map(i => i.id)).toEqual(['b1'])
  })

  it('非连续同批次值分成两组且 key 不同（v-for 唯一性）', () => {
    // act
    const groups = groupPathByBatch([
      { id: 'a1', batch: batchA },
      { id: 'b1', batch: batchB },
      { id: 'a2', batch: batchA },
    ])
    // assert
    expect(groups).toHaveLength(3)
    expect(new Set(groups.map(g => g.key)).size).toBe(3)
  })

  it('无批次条目并入上一组（紧随其后的同批次条目仍归同组）', () => {
    // act
    const groups = groupPathByBatch([
      { id: 'a1', batch: batchA },
      { id: 'x1' },
      { id: 'a2', batch: batchA },
      { id: 'b1', batch: batchB },
      { id: 'x2' },
    ])
    // assert
    expect(groups).toHaveLength(2)
    expect(groups[0].batch).toEqual(batchA)
    expect(groups[0].items.map(i => i.id)).toEqual(['a1', 'x1', 'a2'])
    expect(groups[1].items.map(i => i.id)).toEqual(['b1', 'x2'])
  })

  it('全部无批次 → 单个 batch:null 组（头部回落「—」组头）', () => {
    // arrange：显式标注元素类型（全列表无 batch 时泛型推断回落到约束，裸字面量的 id 会被当作多余属性）
    const items: Array<{ id: string, batch?: PathBatch }> = [{ id: 'x1' }, { id: 'x2' }]
    // act
    const groups = groupPathByBatch(items)
    // assert
    expect(groups).toHaveLength(1)
    expect(groups[0].batch).toBeNull()
    expect(groups[0].items.map(i => i.id)).toEqual(['x1', 'x2'])
  })

  it('头部无批次孤儿并入第一个批次组并保持原相对顺序', () => {
    // act
    const groups = groupPathByBatch([
      { id: 'x1' },
      { id: 'x2' },
      { id: 'a1', batch: batchA },
      { id: 'a2', batch: batchA },
    ])
    // assert
    expect(groups).toHaveLength(1)
    expect(groups[0].batch).toEqual(batchA)
    expect(groups[0].items.map(i => i.id)).toEqual(['x1', 'x2', 'a1', 'a2'])
  })

  it('空列表 → 无分组', () => {
    // act & assert
    expect(groupPathByBatch([])).toEqual([])
  })
})

describe('buildReplanInstruction - 反馈拼接一句话', () => {
  it('positive 与 negative 都拼进续补指令（空格分隔，避免 negativeFromInstruction 粘词）', () => {
    // arrange
    let state = create()
    state = applyFeedback(state, 'good', 'Adele')
    state = applyFeedback(state, 'far', '陈奕迅')
    // act
    const instruction = buildReplanInstruction(state)
    // assert
    expect(instruction).toBe('近一点的方向：Adele；不要 陈奕迅')
  })

  it('negative 分词可被 negativeFromInstruction 正确提取（T-B0 兼容）', () => {
    // arrange
    let state = create()
    state = applyFeedback(state, 'far', 'Adele')
    state = applyFeedback(state, 'far', '陈奕迅')
    // act
    const tokens = negativeFromInstruction(`${buildReplanInstruction(state)}；更冷一点`)
    // assert（T-B0 按 [、/\s]+ 切词：空格分隔的复合名会被拆成多个词元，此处用单一词元艺人）
    expect(tokens.split(' ')).toEqual(['Adele', '陈奕迅'])
    expect(tokens).not.toContain('：')
  })

  it('无反馈时返回空串', () => {
    // act & assert
    expect(buildReplanInstruction(create())).toBe('')
  })
})

describe('toView - 页面视图', () => {
  it('输出路径条目带 isCurrent 标记与剩余计数', () => {
    // arrange
    let state = create()
    state = addRecommendedIds(state, ['r1'])
    state = appendToPath(state, { ...plannedItem('r1', 'Adele', 'Hello'), state: 'played' })
    // act
    const view = toView(state, { currentId: 'r1', remaining: 2 })
    // assert
    expect(view.remaining).toBe(2)
    expect(view.path).toHaveLength(1)
    expect(view.path[0].isCurrent).toBe(true)
    expect(view.anchor.title).toBe('富士山下')
  })

  it('非当前曲目 isCurrent 为 false', () => {
    // arrange
    let state = create()
    state = appendToPath(state, { ...plannedItem('r1', 'Adele', 'Hello'), state: 'played' })
    // act
    const view = toView(state, { currentId: 'other', remaining: 0 })
    // assert
    expect(view.path[0].isCurrent).toBe(false)
  })
})

describe('decideOnSongChange - 切歌判定（D2/D13，TT-1）', () => {
  // 电台路径之外的新歌（未在本会话推荐 id 中）
  const offPathSong = { id: 'u1', singer: 'Adele', name: 'Hello', album: '25', pic: null }

  it('电台关 + 在路径上 → on-path（维持现状语义），不清场', () => {
    // arrange
    const state = addRecommendedIds(create(), ['r1'])
    // act
    const decision = decideOnSongChange(state, { radioEnabled: false, song: { ...offPathSong, id: 'r1' } })
    // assert
    expect(decision).toEqual({ kind: 'on-path', clearIds: [] })
  })

  it('电台关 + 不在路径上 → ignore（不动作、不清场）', () => {
    // arrange
    const state = addRecommendedIds(create(), ['r1'])
    // act & assert
    expect(decideOnSongChange(state, { radioEnabled: false, song: offPathSong })).toEqual({ kind: 'ignore', clearIds: [] })
  })

  it('电台关 + 无会话 → ignore', () => {
    // act & assert
    expect(decideOnSongChange(null, { radioEnabled: false, song: offPathSong })).toEqual({ kind: 'ignore', clearIds: [] })
  })

  it('电台开 + 无会话 + 有新歌 → start（待首切歌开台）', () => {
    // act & assert
    expect(decideOnSongChange(null, { radioEnabled: true, song: offPathSong })).toEqual({ kind: 'start', clearIds: [] })
  })

  it('电台开 + 有会话 + 在路径上 → on-path，不清场', () => {
    // arrange
    const state = addRecommendedIds(create(), ['r1', 'r2'])
    // act & assert
    expect(decideOnSongChange(state, { radioEnabled: true, song: { ...offPathSong, id: 'r2' } }))
      .toEqual({ kind: 'on-path', clearIds: [] })
  })

  it('电台开 + 有会话 + 路径外 → reanchor，clearIds 为本会话全部已推荐 id', () => {
    // arrange
    const state = addRecommendedIds(create(), ['r1', 'r2'])
    // act
    const decision = decideOnSongChange(state, { radioEnabled: true, song: offPathSong })
    // assert
    expect(decision.kind).toBe('reanchor')
    expect(decision.clearIds).toEqual(['r1', 'r2'])
  })

  it('reanchor 的 clearIds 为拷贝：调用方改动不污染原会话', () => {
    // arrange
    const state = addRecommendedIds(create(), ['r1'])
    // act
    const decision = decideOnSongChange(state, { radioEnabled: true, song: offPathSong })
    decision.clearIds.push('x')
    // assert
    expect(state.recommendedIds).toEqual(['r1'])
  })

  it('电台开但无有效新歌 → ignore（无从开台/重锚），有/无会话结果一致', () => {
    // arrange
    const state = addRecommendedIds(create(), ['r1'])
    // act & assert
    expect(decideOnSongChange(state, { radioEnabled: true, song: null })).toEqual({ kind: 'ignore', clearIds: [] })
    expect(decideOnSongChange(null, { radioEnabled: true, song: null })).toEqual({ kind: 'ignore', clearIds: [] })
  })

  it('判定只消费歌曲 id：仅含 id 的最小形状与宽对象结论一致（SongChangeSong 已裁剪为 id）', () => {
    // arrange
    const state = addRecommendedIds(create(), ['r1'])
    // act & assert（id-only 为裁剪后的真实消费形状；宽对象 offPathSong 经结构类型兼容，两条路径判定一致）
    expect(decideOnSongChange(state, { radioEnabled: true, song: { id: 'r1' } }))
      .toEqual({ kind: 'on-path', clearIds: [] })
    expect(decideOnSongChange(state, { radioEnabled: true, song: { id: 'u1' } }))
      .toEqual({ kind: 'reanchor', clearIds: ['r1'] })
  })
})

describe('reanchorSession - 跟歌重锚（收旧台开新台，策略沿用；D2/D7）', () => {
  const nextAnchor: SessionAnchor = { id: 'anchor-2', artist: 'Adele', title: 'Hello', album: '25', pic: null }

  it('锚点替换为新歌，active 保持 true，recommendedIds 与 path 清空归零', () => {
    // arrange
    let state = addRecommendedIds(create(), ['r1', 'r2'])
    state = appendToPath(state, plannedItem('r1', 'Adele', 'Hello'))
    // act
    const reanchored = reanchorSession(state, nextAnchor)
    // assert
    expect(reanchored.active).toBe(true)
    expect(reanchored.anchor).toEqual(nextAnchor)
    expect(reanchored.recommendedIds).toEqual([])
    expect(reanchored.path).toEqual([])
  })

  it('沿用 run 级字段：radius/instruction/正负艺人', () => {
    // arrange（far 反馈会使半径 60 收 8 → 52，检验重锚后沿用反馈后的值）
    let state = createSession(anchor, { radius: 60, instruction: '不要华语' })
    state = applyFeedback(state, 'good', 'Adele')
    state = applyFeedback(state, 'far', '陈奕迅')
    // act
    const reanchored = reanchorSession(state, nextAnchor)
    // assert
    expect(reanchored.radius).toBe(52)
    expect(reanchored.instruction).toBe('不要华语')
    expect(reanchored.positiveArtists).toEqual(['Adele'])
    expect(reanchored.negativeArtists).toEqual(['陈奕迅'])
  })

  it('连续计划失败计数跨重锚延续（run 边界内）', () => {
    // arrange
    const state = recordPlanFailure(recordPlanFailure(create()))
    // act
    const reanchored = reanchorSession(state, nextAnchor)
    // assert
    expect(reanchored.consecutivePlanFailures).toBe(2)
  })

  it('返回新对象，不改动原会话（不可变转移）', () => {
    // arrange
    const state = addRecommendedIds(create(), ['r1'])
    // act
    const reanchored = reanchorSession(state, nextAnchor)
    // assert
    expect(reanchored).not.toBe(state)
    expect(state.anchor).toEqual(anchor)
    expect(state.recommendedIds).toEqual(['r1'])
  })
})

describe('连续计划失败计数与收台判定（D13/AC9）', () => {
  it('createSession 初始连续失败计数为 0，收台阈值为 3 次', () => {
    // act & assert
    expect(create().consecutivePlanFailures).toBe(0)
    expect(PLAN_FAILURE_LIMIT).toBe(3)
  })

  it('recordPlanFailure：计划最终失败一次计数 +1，未达阈值不收台', () => {
    // act
    const state = recordPlanFailure(create())
    // assert
    expect(state.consecutivePlanFailures).toBe(1)
    expect(shouldEndRun(state)).toBe(false)
  })

  it('兼容缺计数字段的旧会话对象：按 0 起计', () => {
    // arrange（模拟 TT-1 之前构造的会话对象，无 consecutivePlanFailures 字段）
    const legacy: SessionState = { ...create() }
    delete legacy.consecutivePlanFailures
    // act
    const state = recordPlanFailure(legacy)
    // assert
    expect(state.consecutivePlanFailures).toBe(1)
    expect(shouldEndRun(legacy)).toBe(false)
  })

  it('recordPlanSuccess：任一计划成功即清零', () => {
    // arrange
    let state = recordPlanFailure(recordPlanFailure(create()))
    // act
    state = recordPlanSuccess(state)
    // assert
    expect(state.consecutivePlanFailures).toBe(0)
    expect(shouldEndRun(state)).toBe(false)
  })

  it('连续失败不足 3 次不收台，达到 3 次触发收台', () => {
    // arrange
    let state = recordPlanFailure(recordPlanFailure(create()))
    // assert（2 次不收台）
    expect(shouldEndRun(state)).toBe(false)
    // act（第 3 次最终失败）
    state = recordPlanFailure(state)
    // assert
    expect(shouldEndRun(state)).toBe(true)
  })

  it('中途成功清零后重新累计：成功后再失败 2 次仍不收台', () => {
    // arrange
    let state = recordPlanFailure(recordPlanFailure(create()))
    state = recordPlanSuccess(state)
    // act
    state = recordPlanFailure(recordPlanFailure(state))
    // assert
    expect(state.consecutivePlanFailures).toBe(2)
    expect(shouldEndRun(state)).toBe(false)
  })

  it('失败计数跨重锚延续：重锚后续计失败仍触发收台', () => {
    // arrange
    let state = recordPlanFailure(create())
    state = reanchorSession(state, { id: 'anchor-2', artist: 'Adele', title: 'Hello' })
    // act
    state = recordPlanFailure(recordPlanFailure(state))
    // assert
    expect(shouldEndRun(state)).toBe(true)
  })
})

describe('analysisStale - 约束变更作废锚点分析（D3，TT-2）', () => {
  it('当前约束与快照一致 → 不作废（续补沿用缓存分析）', () => {
    // arrange
    const state = createSession(anchor, { instruction: '更冷一点' })
    // act & assert
    expect(analysisStale(state, '更冷一点')).toBe(false)
  })

  it('当前约束与快照不一致 → 作废（下一次计划重新分析）', () => {
    // arrange
    const state = createSession(anchor, { instruction: '不要华语' })
    // act & assert
    expect(analysisStale(state, '更冷一点')).toBe(true)
  })

  it('快照为空串（首轮在无约束下产出的分析）后用户补一句约束 → 作废', () => {
    // arrange
    const state = createSession(anchor, { instruction: '来点英式摇滚' })
    // act & assert
    expect(analysisStale(state, '')).toBe(true)
  })

  it('快照有约束而当前约束被清空 → 作废（召回方向随之换道）', () => {
    // arrange
    const state = createSession(anchor, { instruction: '' })
    // act & assert
    expect(analysisStale(state, '更冷一点')).toBe(true)
  })

  it('当前约束与快照均为空串 → 不作废', () => {
    // act & assert
    expect(analysisStale(create(), '')).toBe(false)
  })

  it('快照缺失（null/undefined/未传：首轮尚无缓存分析或旧会话对象）→ 不作废，不重复判废', () => {
    // arrange
    const state = createSession(anchor, { instruction: '更冷一点' })
    // act & assert
    expect(analysisStale(state, null)).toBe(false)
    expect(analysisStale(state, undefined)).toBe(false)
    expect(analysisStale(state)).toBe(false)
  })

  it('只比对 st.instruction 原样值：反馈（far/good）拼接进续补指令但不触发作废', () => {
    // arrange（D3 只针对一句话约束；反馈经由 buildReplanInstruction 影响排序，不要求重析锚点）
    let state = createSession(anchor, { instruction: '更冷一点' })
    state = applyFeedback(state, 'good', 'Adele')
    state = applyFeedback(state, 'far', '陈奕迅')
    // act & assert
    expect(buildReplanInstruction(state)).not.toBe('')
    expect(analysisStale(state, '更冷一点')).toBe(false)
  })

  it('入参宽松：会话缺省按空串计（null 会话与空串快照判一致，与非空快照判作废）', () => {
    // act & assert
    expect(analysisStale(null, '')).toBe(false)
    expect(analysisStale(null, '更冷一点')).toBe(true)
  })
})

describe('收台重开与批次快照边界（D7/AC4，TT-2）', () => {
  it('收台后重开 = 全新 run：约束/正负艺人/推荐与路径/连续失败计数全部归零，半径回落设置默认而非沿用旧 run', () => {
    // arrange：旧 run 已积累约束、反馈、推荐与连续失败（编排层收台时丢弃整个旧会话对象，全部随之清空）
    let oldRun = createSession(anchor, { radius: 60, instruction: '不要华语' })
    oldRun = applyFeedback(oldRun, 'good', 'Adele')
    oldRun = applyFeedback(oldRun, 'far', '陈奕迅')
    oldRun = recordPlanFailure(addRecommendedIds(oldRun, ['r1']))
    // act：重开即 createSession 全新对象（编排层只传锚点与设置默认半径，不接收任何旧 run 状态）
    const settingDefaultRadius = 50
    const reopened = createSession(anchor, { radius: settingDefaultRadius })
    // assert（先确认旧 run 确已积累策略状态，重开对照才成立）
    expect(oldRun.instruction).toBe('不要华语')
    expect(oldRun.consecutivePlanFailures).toBe(1)
    expect(reopened.active).toBe(true)
    expect(reopened.radius).toBe(settingDefaultRadius)
    expect(reopened.instruction).toBe('')
    expect(reopened.positiveArtists).toEqual([])
    expect(reopened.negativeArtists).toEqual([])
    expect(reopened.recommendedIds).toEqual([])
    expect(reopened.path).toEqual([])
    expect(reopened.consecutivePlanFailures).toBe(0)
  })

  it('约束变更后下一批次的批次快照记录新 instruction（AC3 冒烟的路径组头可观察证据）', () => {
    // arrange
    let state = createSession(anchor, { instruction: '更冷一点' })
    // act：run 内修改一句话约束后，编排层以计划发起时的 st.instruction 构造批次快照常入路径
    state = updateInstruction(state, '来点英式摇滚')
    state = appendToPath(state, {
      ...plannedItem('r1', 'Oasis', 'Wonderwall'),
      batch: { radius: state.radius, instruction: state.instruction, engine: 'ai' },
    })
    // assert
    expect(state.path[0].batch?.instruction).toBe('来点英式摇滚')
  })
})

describe('START_RADIO_DEBOUNCE_MS - 开台/重锚计划防抖量级', () => {
  it('与续补 REFILL_DEBOUNCE_MS 同量级（1200ms），防快速连切连发计划', () => {
    // act & assert
    expect(START_RADIO_DEBOUNCE_MS).toBe(1200)
  })
})

describe('accumulatePlayTime/readPlayedMs - 播放时长累计器（TT-4，30 秒跳过率的时长口径）', () => {
  it('play → pause 累计一段播放时长，停表后读数不再增长', () => {
    // arrange
    let state = createPlayTimeState()
    // act：10s 处播放，25s 处暂停
    state = accumulatePlayTime(state, 'play', 10_000)
    state = accumulatePlayTime(state, 'pause', 25_000)
    // assert
    expect(readPlayedMs(state, 99_000)).toBe(15_000)
    expect(state.playing).toBe(false)
    expect(state.totalMs).toBe(15_000)
  })

  it('多段 play/pause 分段合计', () => {
    // arrange
    let state = createPlayTimeState()
    // act：10s-20s 一段，30s-45s 一段
    state = accumulatePlayTime(state, 'play', 10_000)
    state = accumulatePlayTime(state, 'pause', 20_000)
    state = accumulatePlayTime(state, 'play', 30_000)
    state = accumulatePlayTime(state, 'pause', 45_000)
    // assert
    expect(readPlayedMs(state, 50_000)).toBe(25_000)
  })

  it('暂停区间不计时长（play→pause→长暂停→play→pause 只计两段播放）', () => {
    // arrange
    let state = createPlayTimeState()
    // act：播放 5s → 暂停 600s（不计）→ 再播放 12s
    state = accumulatePlayTime(state, 'play', 0)
    state = accumulatePlayTime(state, 'pause', 5_000)
    state = accumulatePlayTime(state, 'play', 605_000)
    state = accumulatePlayTime(state, 'pause', 617_000)
    // assert：墙钟跨度 617s，实际播放仅 5+12=17s
    expect(readPlayedMs(state, 617_000)).toBe(17_000)
  })

  it('播放中未暂停时在途分段实时计入读数（含在途累计）', () => {
    // arrange
    let state = createPlayTimeState()
    state = accumulatePlayTime(state, 'play', 10_000)
    // act & assert：读取时点 18s → 在途 8s 计入；但尚未结算进 totalMs
    expect(readPlayedMs(state, 18_000)).toBe(8_000)
    expect(state.totalMs).toBe(0)
    expect(state.playing).toBe(true)
  })

  it('trackEnd 结算在途分段并停表（切歌结算口径）', () => {
    // arrange
    let state = createPlayTimeState()
    state = accumulatePlayTime(state, 'play', 10_000)
    // act：20s 处切歌结算
    state = accumulatePlayTime(state, 'trackEnd', 20_000)
    // assert：结算值含在途段，后续读数不再增长
    expect(state.playing).toBe(false)
    expect(readPlayedMs(state, 99_000)).toBe(10_000)
  })

  it('清零换曲：createPlayTimeState 为零态，上一首结算后换新累计器互不影响（编排层换曲动作）', () => {
    // arrange：上一首播了 12s 被切走
    let prev = accumulatePlayTime(createPlayTimeState(), 'play', 0)
    prev = accumulatePlayTime(prev, 'trackEnd', 12_000)
    // act：编排层换曲 = 丢弃旧累计器换新零态
    const next = createPlayTimeState()
    // assert
    expect(prev.totalMs).toBe(12_000)
    expect(next).toEqual({ playing: false, lastTs: null, totalMs: 0 })
    expect(readPlayedMs(next, 99_000)).toBe(0)
  })

  it('播放中重复 play 重新锚定，不重复计时（自然接续切歌无独立 pause 事件）', () => {
    // arrange：10s play（切歌时 isPlay 开口子），12s 又来 play（播放器 onPlaying 事件）
    let state = createPlayTimeState()
    state = accumulatePlayTime(state, 'play', 10_000)
    // act
    state = accumulatePlayTime(state, 'play', 12_000)
    state = accumulatePlayTime(state, 'pause', 20_000)
    // assert：10-20s 连续计 10s，两次 play 之间不重复累计
    expect(readPlayedMs(state, 21_000)).toBe(10_000)
  })

  it('未播放时的 pause/trackEnd 无操作', () => {
    // arrange & act
    let state = accumulatePlayTime(createPlayTimeState(), 'pause', 10_000)
    state = accumulatePlayTime(state, 'trackEnd', 20_000)
    // assert
    expect(state).toEqual({ playing: false, lastTs: null, totalMs: 0 })
  })

  it('时钟回拨（负增量）按 0 计', () => {
    // arrange
    let state = accumulatePlayTime(createPlayTimeState(), 'play', 20_000)
    // act：ts 倒退
    state = accumulatePlayTime(state, 'pause', 10_000)
    // assert
    expect(state.totalMs).toBe(0)
  })

  it('宽松入参：null/undefined 状态按零态处理，未知事件与非法 ts 不动作', () => {
    // act & assert
    expect(accumulatePlayTime(null, 'play', 1_000).playing).toBe(true)
    expect(readPlayedMs(null, 1_000)).toBe(0)
    expect(readPlayedMs(undefined)).toBe(0)
    const zero = createPlayTimeState()
    expect(accumulatePlayTime(zero, 'whatever', 1_000)).toBe(zero)
    expect(accumulatePlayTime(zero, 'play', Number.NaN)).toBe(zero)
  })

  it('不可变转移：返回新对象，不改动原状态', () => {
    // arrange
    const zero: PlayTimeState = createPlayTimeState()
    // act
    const playing = accumulatePlayTime(zero, 'play', 1_000)
    // assert
    expect(playing).not.toBe(zero)
    expect(zero).toEqual({ playing: false, lastTs: null, totalMs: 0 })
  })
})

describe('reduceMetrics - 30 秒跳过率（TT-4/D9，推荐归属由编排层判定）', () => {
  const endedUnder30: MetricsEvent = { type: 'trackEnded', recommendedId: 'r1', playedSeconds: 12 }

  it('推荐曲播放不足 30 秒被切走：分子 skippedUnder30s 与分母 recommendedEnded 均 +1', () => {
    // act
    const state = reduceMetrics(createMetricsState(), endedUnder30)
    // assert
    expect(state.skippedUnder30s).toBe(1)
    expect(state.recommendedEnded).toBe(1)
  })

  it('推荐曲播放达到 30 秒：仅分母 +1，恰好 30 秒不算跳过（<30 口径）', () => {
    // arrange & act
    const state30 = reduceMetrics(createMetricsState(), { type: 'trackEnded', recommendedId: 'r1', playedSeconds: SKIP_JUDGE_SECONDS })
    const state60 = reduceMetrics(createMetricsState(), { type: 'trackEnded', recommendedId: 'r1', playedSeconds: 61.5 })
    // assert
    expect(state30.skippedUnder30s).toBe(0)
    expect(state30.recommendedEnded).toBe(1)
    expect(state60.skippedUnder30s).toBe(0)
    expect(SKIP_JUDGE_SECONDS).toBe(30)
  })

  it('非推荐曲切走（recommendedId 缺失/空串）不动作：分母只统计推荐曲', () => {
    // arrange
    const zero = createMetricsState()
    // act & assert
    expect(reduceMetrics(zero, { type: 'trackEnded', playedSeconds: 5 })).toBe(zero)
    expect(reduceMetrics(zero, { type: 'trackEnded', recommendedId: null, playedSeconds: 5 })).toBe(zero)
    expect(reduceMetrics(zero, { type: 'trackEnded', recommendedId: '', playedSeconds: 5 })).toBe(zero)
  })

  it('playedSeconds 垃圾值（NaN/负数/未传）按 0 计，归入不足 30 秒', () => {
    // arrange & act
    const byNaN = reduceMetrics(createMetricsState(), { type: 'trackEnded', recommendedId: 'r1', playedSeconds: Number.NaN })
    const byNegative = reduceMetrics(createMetricsState(), { type: 'trackEnded', recommendedId: 'r1', playedSeconds: -3 })
    const byMissing = reduceMetrics(createMetricsState(), { type: 'trackEnded', recommendedId: 'r1' })
    // assert
    expect(byNaN.skippedUnder30s).toBe(1)
    expect(byNegative.skippedUnder30s).toBe(1)
    expect(byMissing.skippedUnder30s).toBe(1)
  })

  it('recommendedStarted 供人读：trackStarted 带 recommended 标记才计数', () => {
    // arrange & act
    let state = reduceMetrics(createMetricsState(), { type: 'trackStarted', id: 'r1', recommended: true })
    state = reduceMetrics(state, { type: 'trackStarted', id: 'r2', recommended: true })
    state = reduceMetrics(state, { type: 'trackStarted', id: 'u1' })
    state = reduceMetrics(state, { type: 'trackStarted', id: 'u2', recommended: false })
    // assert
    expect(state.recommendedStarted).toBe(2)
  })
})

describe('reduceMetrics - far/good 反馈计数（TT-4/D9）', () => {
  it('feedback far/good 分别计数', () => {
    // arrange & act
    let state = reduceMetrics(createMetricsState(), { type: 'feedback', kind: 'far' })
    state = reduceMetrics(state, { type: 'feedback', kind: 'good' })
    state = reduceMetrics(state, { type: 'feedback', kind: 'good' })
    // assert
    expect(state.farCount).toBe(1)
    expect(state.goodCount).toBe(2)
  })

  it('未知反馈类型不动作（宽松入参）', () => {
    // arrange
    const zero = createMetricsState()
    // act & assert
    expect(reduceMetrics(zero, { type: 'feedback', kind: 'meh' })).toBe(zero)
    expect(reduceMetrics(zero, { type: 'feedback' })).toBe(zero)
  })
})

describe('reduceMetrics - run 存活计数（TT-4/D9）', () => {
  it('runStarted → runEnded：runCount +1，lastRunDurationMs 与累计 runTotalMs 记录时长', () => {
    // arrange & act
    let state = reduceMetrics(createMetricsState(), { type: 'runStarted', ts: 100_000 })
    state = reduceMetrics(state, { type: 'runEnded', ts: 160_000 })
    // assert
    expect(state.runCount).toBe(1)
    expect(state.lastRunDurationMs).toBe(60_000)
    expect(state.runTotalMs).toBe(60_000)
    // 收台后无在途 run（在途起点已清空）
    expect(state.runStartTs).toBeNull()
  })

  it('多个 run 累计时长，lastRunDurationMs 只记最近一次', () => {
    // arrange & act
    let state = reduceMetrics(createMetricsState(), { type: 'runStarted', ts: 0 })
    state = reduceMetrics(state, { type: 'runEnded', ts: 10_000 })
    state = reduceMetrics(state, { type: 'runStarted', ts: 100_000 })
    state = reduceMetrics(state, { type: 'runEnded', ts: 125_000 })
    // assert
    expect(state.runCount).toBe(2)
    expect(state.runTotalMs).toBe(35_000)
    expect(state.lastRunDurationMs).toBe(25_000)
  })

  it('无在途 run 的 runEnded 不动作；结算后重复 runEnded 仍不动作（收台清零口径）', () => {
    // arrange：无 run 直接收台
    const zero = createMetricsState()
    // act & assert
    expect(reduceMetrics(zero, { type: 'runEnded', ts: 1_000 })).toBe(zero)
    // arrange：正常收台后再来一次收台事件（重锚内部收旧台已 keepRunAlive 过滤，此处再兜底幂等）
    let state = reduceMetrics(zero, { type: 'runStarted', ts: 0 })
    state = reduceMetrics(state, { type: 'runEnded', ts: 5_000 })
    // act
    const again = reduceMetrics(state, { type: 'runEnded', ts: 9_000 })
    // assert：二次收台不重复计入时长
    expect(again.runTotalMs).toBe(5_000)
    expect(again.runCount).toBe(1)
  })

  it('重复 runStarted（未收台再开台）按新 run 如实计数并重置在途起点（编排层保证只在 run 边界注入）', () => {
    // arrange & act
    let state = reduceMetrics(createMetricsState(), { type: 'runStarted', ts: 0 })
    state = reduceMetrics(state, { type: 'runStarted', ts: 50_000 })
    state = reduceMetrics(state, { type: 'runEnded', ts: 70_000 })
    // assert：第二次开台覆盖在途起点，结算时长从 50s 起算
    expect(state.runCount).toBe(2)
    expect(state.lastRunDurationMs).toBe(20_000)
    expect(state.runTotalMs).toBe(20_000)
  })

  it('runStarted/runEnded 的 ts 垃圾值宽松处理：开台次数照计，起点未知的半截 run 不结算（不污染时长累计）', () => {
    // arrange & act
    let state = reduceMetrics(createMetricsState(), { type: 'runStarted' })
    state = reduceMetrics(state, { type: 'runEnded', ts: 100_000 })
    // assert
    expect(state.runCount).toBe(1)
    expect(state.lastRunDurationMs).toBeNull()
    expect(state.runTotalMs).toBe(0)
  })
})

describe('reduceMetrics - 续补消费比（TT-4/D9：同批任一曲目进入已播即记该批一次，一批仅记一次）', () => {
  const planA: MetricsEvent = { type: 'refillPlanned', batchKey: 'batch-a', ids: ['a1', 'a2', 'a3'] }
  const planB: MetricsEvent = { type: 'refillPlanned', batchKey: 'batch-b', ids: ['b1', 'b2'] }

  it('refillPlanned 登记批次：plannedBatches +1，ids 归一并去空', () => {
    // act
    const state = reduceMetrics(createMetricsState(), { type: 'refillPlanned', batchKey: 'batch-x', ids: ['x1', '', null, 'x1', 'x2'] })
    // assert
    expect(state.plannedBatches).toBe(1)
    expect(state.batches['batch-x']).toEqual({ ids: ['x1', 'x2'], consumed: false })
  })

  it('同批任一曲目 trackStarted 即记该批被消费一次，同批第二首不再计（去重）', () => {
    // arrange
    let state = reduceMetrics(createMetricsState(), planA)
    // act：同批两首先后进入已播
    state = reduceMetrics(state, { type: 'trackStarted', id: 'a1', recommended: true })
    state = reduceMetrics(state, { type: 'trackStarted', id: 'a2', recommended: true })
    // assert
    expect(state.consumedBatches).toBe(1)
    expect(state.plannedBatches).toBe(1)
    expect(state.batches['batch-a'].consumed).toBe(true)
  })

  it('同一曲目属于两个未消费批次时，两批分别各记一次消费', () => {
    // arrange：x1 同时出现在批 A 与批 B（跨 run 重复推荐的宽松场景）
    let state = reduceMetrics(createMetricsState(), { type: 'refillPlanned', batchKey: 'batch-a', ids: ['x1'] })
    state = reduceMetrics(state, { type: 'refillPlanned', batchKey: 'batch-b', ids: ['x1'] })
    // act
    state = reduceMetrics(state, { type: 'trackStarted', id: 'x1', recommended: true })
    // assert
    expect(state.consumedBatches).toBe(2)
    expect(state.batches['batch-a'].consumed).toBe(true)
    expect(state.batches['batch-b'].consumed).toBe(true)
  })

  it('未知曲目/空 id 的 trackStarted 不影响消费计数，但已消费批次的其他 id 仍可独立触发', () => {
    // arrange
    let state = reduceMetrics(createMetricsState(), planA)
    state = reduceMetrics(state, planB)
    // act：未知 id 与空 id
    state = reduceMetrics(state, { type: 'trackStarted', id: 'u1' })
    state = reduceMetrics(state, { type: 'trackStarted', id: null })
    state = reduceMetrics(state, { type: 'trackStarted' })
    // assert
    expect(state.consumedBatches).toBe(0)
    // act：batch-b 的曲目进入已播（batch-a 未消费不受影响）
    state = reduceMetrics(state, { type: 'trackStarted', id: 'b2' })
    // assert
    expect(state.consumedBatches).toBe(1)
    expect(state.batches['batch-b'].consumed).toBe(true)
    expect(state.batches['batch-a'].consumed).toBe(false)
  })

  it('同 key 重复 refillPlanned：plannedBatches 仍 +1（一次计划一次计数），登记重置为最新曲目', () => {
    // arrange：同条件下再次计划（批次快照 key 相同，如重开后同半径同约束）
    let state = reduceMetrics(createMetricsState(), planA)
    state = reduceMetrics(state, { type: 'trackStarted', id: 'a1' })
    expect(state.batches['batch-a'].consumed).toBe(true)
    // act：同 key 重新登记新曲目集合
    state = reduceMetrics(state, { type: 'refillPlanned', batchKey: 'batch-a', ids: ['a9'] })
    // assert
    expect(state.plannedBatches).toBe(2)
    expect(state.consumedBatches).toBe(1)
    expect(state.batches['batch-a']).toEqual({ ids: ['a9'], consumed: false })
  })

  it('batchKey 缺失/空串的 refillPlanned 不动作', () => {
    // arrange
    const zero = createMetricsState()
    // act & assert
    expect(reduceMetrics(zero, { type: 'refillPlanned', ids: ['a1'] })).toBe(zero)
    expect(reduceMetrics(zero, { type: 'refillPlanned', batchKey: '', ids: ['a1'] })).toBe(zero)
  })
})

describe('reduceMetrics/hydrateMetrics - 不变性、水合与宽松入参（TT-4/AC7）', () => {
  it('reduceMetrics 不可变转移：返回新对象，原指标状态不变', () => {
    // arrange
    const zero: MetricsState = createMetricsState()
    // act
    const next = reduceMetrics(zero, { type: 'feedback', kind: 'far' })
    // assert
    expect(next).not.toBe(zero)
    expect(zero.farCount).toBe(0)
    expect(next.farCount).toBe(1)
  })

  it('null/undefined 状态与空事件宽松处理：null 状态从零态起计，空事件返回零态', () => {
    // act & assert
    expect(reduceMetrics(null, { type: 'feedback', kind: 'good' }).goodCount).toBe(1)
    const zero = createMetricsState()
    expect(reduceMetrics(zero, null)).toBe(zero)
    expect(reduceMetrics(zero, undefined)).toBe(zero)
  })

  it('hydrateMetrics：null/非对象快照归一为零态', () => {
    // act & assert
    expect(hydrateMetrics(null)).toEqual(createMetricsState())
    expect(hydrateMetrics(undefined)).toEqual(createMetricsState())
    expect(hydrateMetrics('junk')).toEqual(createMetricsState())
    expect(hydrateMetrics(42)).toEqual(createMetricsState())
  })

  it('hydrateMetrics：有效字段保留，缺失/垃圾字段缺省补齐（旧版本快照兼容）', () => {
    // arrange：模拟旧快照：farCount 有效、skippedUnder30s 缺失、runTotalMs 为垃圾、lastRunDurationMs 非法
    const raw = { farCount: 3, goodCount: 'junk', runTotalMs: Number.NaN, lastRunDurationMs: -5 }
    // act
    const state = hydrateMetrics(raw)
    // assert
    expect(state.farCount).toBe(3)
    expect(state.goodCount).toBe(0)
    expect(state.runTotalMs).toBe(0)
    expect(state.lastRunDurationMs).toBeNull()
    expect(state.skippedUnder30s).toBe(0)
    expect(state.batches).toEqual({})
  })

  it('hydrateMetrics：批次表保留消费标记与曲目 id，丢弃在途 runStartTs（重启不结算半截 run）', () => {
    // arrange：落盘时 run 仍在途（应用退出未触发 runEnded）
    const raw = {
      runCount: 2,
      runTotalMs: 10_000,
      runStartTs: 999_999,
      batches: {
        'batch-a': { ids: ['a1', '', 42], consumed: true },
        'batch-b': { ids: ['b1'], consumed: 1 },
        'batch-garbage': 'junk',
      },
    }
    // act
    const state = hydrateMetrics(raw)
    // assert：在途起点被丢弃；批次 ids 归一（去空、字符串化）；消费标记只认 true
    expect(state.runStartTs).toBeNull()
    expect(state.runCount).toBe(2)
    expect(state.batches['batch-a']).toEqual({ ids: ['a1', '42'], consumed: true })
    expect(state.batches['batch-b']).toEqual({ ids: ['b1'], consumed: false })
    expect(state.batches['batch-garbage']).toBeUndefined()
  })

  it('水合后归并：重启续计在旧值上增长（AC7：重启后可读且随事件增长）', () => {
    // arrange：重启前已累计的快照
    const persisted = JSON.parse(JSON.stringify(reduceMetrics(reduceMetrics(createMetricsState(), { type: 'feedback', kind: 'far' }), { type: 'refillPlanned', batchKey: 'batch-a', ids: ['a1'] }))) as unknown
    // act：水合后新事件到达（切歌消费批次 + 新反馈）
    let state = hydrateMetrics(persisted)
    state = reduceMetrics(state, { type: 'trackStarted', id: 'a1', recommended: true })
    state = reduceMetrics(state, { type: 'trackEnded', recommendedId: 'a1', playedSeconds: 8 })
    state = reduceMetrics(state, { type: 'feedback', kind: 'far' })
    // assert：计数在旧值基础上续增，批次消费状态经水合延续
    expect(state.farCount).toBe(2)
    expect(state.plannedBatches).toBe(1)
    expect(state.consumedBatches).toBe(1)
    expect(state.recommendedStarted).toBe(1)
    expect(state.recommendedEnded).toBe(1)
    expect(state.skippedUnder30s).toBe(1)
  })

  it('指标状态为纯 JSON 快照：JSON 序列化往返后等值（data.ts 落盘通道前置保障）', () => {
    // arrange：跑一串混合事件后的最终状态
    let state = createMetricsState()
    const events: MetricsEvent[] = [
      { type: 'runStarted', ts: 0 },
      { type: 'refillPlanned', batchKey: 'batch-a', ids: ['a1'] },
      { type: 'trackStarted', id: 'a1', recommended: true },
      { type: 'trackEnded', recommendedId: 'a1', playedSeconds: 5 },
      { type: 'feedback', kind: 'good' },
      { type: 'runEnded', ts: 30_000 },
    ]
    for (const event of events) state = reduceMetrics(state, event)
    // act & assert
    expect(JSON.parse(JSON.stringify(state))).toEqual(state)
  })
})


describe('retained source identity in session state', () => {
  it('dislike keeps distinct retained aliases even when they share a collaborator', () => {
    const preferred = sourceInfo('wy_song', 'Primary / Collaborator')
    const alternative = sourceInfo('tx_song', 'Alias / Collaborator')
    let state = applyFeedback(create(), 'dislike', preferred.singer, {
      artist: preferred.singer,
      title: preferred.name,
      musicInfo: preferred,
      alternativeMusicInfos: [alternative],
    })
    expect(state.dislikedTracks).toContainEqual({ artist: preferred.singer, title: 'Song' })
    expect(state.dislikedTracks).toContainEqual({ artist: alternative.singer, title: 'Song' })
    expect(state.dislikedTracks).toHaveLength(2)
    state = applyFeedback(state, 'dislike', preferred.singer, {
      artist: preferred.singer,
      title: preferred.name,
      alternativeMusicInfos: [alternative, sourceInfo('kg_song', 'Another Alias')],
    })
    expect(state.dislikedTracks).toContainEqual({ artist: 'Another Alias', title: 'Song' })
    expect(state.dislikedTracks).toHaveLength(3)
    expect(state.negativeArtists).toEqual([])
  })

  it.each([false, true])('path matching checks retained source metadata on either side (incoming=%s)', (incoming) => {
    const withSources = {
      ...plannedItem('wy_song', 'Primary', 'Song'),
      musicInfo: sourceInfo('wy_song', 'Primary'),
      alternativeMusicInfos: [sourceInfo('tx_song', 'Alias')],
    }
    const alias = { ...plannedItem('other_song', 'Alias', 'Song'), musicInfo: sourceInfo('other_song', 'Alias') }
    const first = incoming ? alias : withSources
    const next = incoming ? withSources : alias
    const state = appendToPath(appendToPath(create(), first), { ...next, state: 'played' })
    expect(state.path).toHaveLength(1)
    expect(state.path[0].state).toBe('played')
    const retained = [state.path[0].musicInfo, ...(state.path[0].alternativeMusicInfos ?? [])]
    expect(retained.map(info => info?.id).sort((a, b) => String(a).localeCompare(String(b)))).toEqual(['other_song', 'tx_song', 'wy_song'])
  })

  it('source IDs update the original path item and preserve older metadata on sparse playback writes', () => {
    const preferred = sourceInfo('wy_song', 'Primary')
    const alternative = sourceInfo('tx_song', 'Alias')
    const planned = { ...plannedItem('wy_song', 'Primary', 'Song'), musicInfo: preferred, alternativeMusicInfos: [alternative] }
    const state = appendToPath(appendToPath(create(), planned), {
      ...plannedItem('tx_song', 'Other display', 'Other title'), state: 'played',
    })
    expect(state.path).toHaveLength(1)
    expect(state.path[0].musicInfo).toEqual(preferred)
    expect(state.path[0].alternativeMusicInfos).toEqual([alternative])
    expect(toView(state, { currentId: 'wy_song', remaining: 0 }).path[0].isCurrent).toBe(true)
  })

  it('retained artist aliases do not collapse studio and Live path entries', () => {
    const state = appendToPath(appendToPath(create(), {
      ...plannedItem('wy_song', 'Primary', 'Song'),
      alternativeMusicInfos: [sourceInfo('tx_song', 'Alias')],
    }), plannedItem('live', 'Alias', 'Song (Live)'))
    expect(state.path).toHaveLength(2)
  })
})


describe('path identity bridge updates', () => {
  it('a late bridge merges every matching entry at the earliest position and keeps all source metadata', () => {
    const firstBatch: PathBatch = { radius: 30, instruction: 'first', engine: 'platform' }
    const first = { ...plannedItem('a', 'Artist A', 'Song'), musicInfo: sourceInfo('a', 'Artist A'), batch: firstBatch }
    const second = { ...plannedItem('b', 'Artist B', 'Song'), musicInfo: sourceInfo('b', 'Artist B') }
    let state = appendToPath(appendToPath(appendToPath(create(), first), plannedItem('unrelated', 'Other', 'Other')), second)
    state = appendToPath(state, {
      ...plannedItem('bridge', 'Artist A (Artist B)', 'Song'),
      musicInfo: sourceInfo('bridge', 'Artist A (Artist B)'),
      state: 'played',
    })
    expect(state.path.map(item => item.id)).toEqual(['bridge', 'unrelated'])
    expect(state.path[0].batch).toEqual(firstBatch)
    expect(state.path[0].alternativeMusicInfos?.map(info => info.id)).toEqual(['a', 'b'])
  })

  it('R3 回归：per-pair 时长冲突检验阻断跨对借用（[A、C 180s, A、D 230s] 不误并 B、C 230s）', () => {
    const first = {
      ...plannedItem('wy_ac', '主唱A、合作者C', '同名曲'),
      interval: '03:00',
      musicInfo: { ...sourceInfo('wy_ac', '主唱A、合作者C'), name: '同名曲', interval: '03:00' },
      alternativeMusicInfos: [{ ...sourceInfo('tx_ad', '主唱A、合作者D'), name: '同名曲', interval: '03:50' }],
    }
    const second = {
      ...plannedItem('tx_bc', '主唱B、合作者C', '同名曲'),
      interval: '03:50',
      musicInfo: { ...sourceInfo('tx_bc', '主唱B、合作者C'), name: '同名曲', interval: '03:50' },
    }
    const state = appendToPath(appendToPath(create(), first), second)
    expect(state.path.map(p => p.id)).toEqual(['wy_ac', 'tx_bc'])
  })
})
