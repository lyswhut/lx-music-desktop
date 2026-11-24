/**
 * 探索会话状态机（纯逻辑，T-B2）。
 *
 * “从此歌出发”会话的领域状态与转移：创建、半径/指令更新、反馈（far/good）、
 * 路径追加、推荐 id 集合、续补判断与续补指令拼接；
 * TT-1 电台化新增：跟歌重锚（reanchorSession）、切歌判定（decideOnSongChange）、
 * 连续计划失败计数与收台判定（recordPlanFailure/recordPlanSuccess/shouldEndRun）；
 * TT-2 新增：锚点分析作废判定（analysisStale，一句话约束变更即作废，D3）；
 * TT-4 新增：播放时长累计器（accumulatePlayTime/readPlayedMs，30 秒跳过率取实际播放秒数）与
 * 本地指标归并（reduceMetrics/hydrateMetrics，D9 四计数器 + D14 落盘水合）。
 * 本模块不依赖任何 lx 运行时模块（无 @common/@renderer/electron 与 IPC 依赖），由 vitest 直接测试；
 * 播放器/事件/引擎的编排见 session.ts（薄层）。
 */

import { musicInfosOf, songRefs, uniqueMusicInfos } from './songIdentity'
import type { SongIdentity } from './songIdentity'
import { sameSong, type SongRef } from './sameSong'
import { isStrictSameRecording, parseIntervalSec, sameSongSimplified, SEED_MATCH_DURATION_TOLERANCE_SEC } from './seedMatch'
import type { SimilarProviderId } from './similarFusion'

/** 探索距离下限（feedback far 的边界）。 */
export const RADIUS_MIN = 10
/** 探索距离上限。 */
export const RADIUS_MAX = 90
/** 默认探索距离（与引擎 updateSession 的 35 一致）。 */
export const RADIUS_DEFAULT = 35
/** far 反馈每次减少的距离。 */
export const FEEDBACK_RADIUS_STEP = 8
/** 队列剩余小于等于该值时自动续补。 */
export const REFILL_THRESHOLD = 3
/** 路径最多保留的条目数（防无限增长）。 */
export const MAX_PATH = 60
/**
 * 开台/重锚首计划的防抖间隔（毫秒）。
 * 与续补 REFILL_DEBOUNCE_MS（session.ts，1200ms）同量级：快速连切时吸抖，
 * 只保留最后一次切歌的计划，避免切歌风暴连发 LLM 调用（D2 风险项）。
 */
export const START_RADIO_DEBOUNCE_MS = 1200
/** 同一 run 内连续计划最终失败达到该次数即收台（initial 失败与续补重试耗尽均计入，任一成功清零；D13）。 */
export const PLAN_FAILURE_LIMIT = 3

/**
 * 反馈类型：far=太远了（收紧距离，仅旧引擎）；good=就这个方向（喜欢这首）；
 * dislike=不再推荐这首（平台推荐默认反馈，曲目进会话级不再推荐列表，与收藏无关）。
 */
export type FeedbackKind = 'far' | 'good' | 'dislike'

/** 会话起点（从当前播放歌曲提取）。 */
export interface SessionAnchor extends SongIdentity {
  id?: string | null
  artist: string
  title: string
  album?: string
  /** 封面（用于会话卡片展示）。 */
  pic?: string | null
  /** 起点音乐来源（'wy'|'tx'|其他；平台相似种子定位用，不解析全局 id 字符串猜测）。 */
  source?: string | null
  /** 起点在各平台的原生歌曲 id（当前歌曲来自 wy/tx 时直接可用，免搜索定位）。 */
  seedIds?: { wy?: string, tx?: string } | null
  /** 起点时长（秒；跨平台种子定位的版本甄别用，未知为 null）。 */
  intervalSec?: number | null
}

/** 路径条目状态：planned=已计划未播，played=已听过。 */
export type PathState = 'played' | 'planned'

/** 路径条目的批次标注：该条目来自哪次计划及其筛选条件快照（供路径分层展示）。 */
export interface PathBatch {
  /** 计划发起时的探索距离。 */
  radius: number
  /** 计划发起时的一句话约束（用户原样输入，不含反馈拼接）。 */
  instruction: string
  /** 该次计划实际使用的引擎（平台相似 / AI 或本地回退）。 */
  engine: 'platform' | 'ai' | 'local'
}

/** 路径条目（含来源原因、来源徽章、封面与弧线角色）。 */
export interface SessionPathItem {
  id: string | null
  artist: string
  title: string
  album?: string
  reason: string
  journeyRole: string
  state: PathState
  /** 批次快照（计划入队时写入；切歌回写 played 时继承，不丢失）。 */
  batch?: PathBatch
  /** 结构化推荐来源徽章（平台推荐模式写入；切歌回写 played 时继承，不丢失）。 */
  recommendSources?: Array<{ provider: SimilarProviderId, rank: number }>
  /** 曲目封面 URL（可选，供探索页展示）。 */
  picUrl?: string | null
  /** 曲目时长展示字符串（可选，如 '04:20'）。 */
  interval?: string | null
  /** 可播放的完整音乐信息（引擎透传；路径点击跳播用，无则不可跳播）。 */
  musicInfo?: LX.Music.MusicInfoOnline
  alternativeMusicInfos?: LX.Music.MusicInfoOnline[]
}

/** 会话状态（纯数据，转移函数返回新对象）。 */
export interface SessionState {
  active: boolean
  anchor: SessionAnchor
  radius: number
  instruction: string
  positiveArtists: string[]
  negativeArtists: string[]
  recommendedIds: string[]
  path: SessionPathItem[]
  /**
   * 会话内明确「喜欢这首」的曲目（good 反馈累积，与 dislikedTracks 严格互斥；收台与重锚清空）。
   */
  likedTracks: SongRef[]
  /**
   * 会话内明确「不再推荐」的曲目（dislike 反馈累积；同曲去重，与 likedTracks 严格互斥）。
   * 会话级生命周期：同 run 重锚沿用，收台/新会话清空；与收藏列表无关。
   */
  dislikedTracks: SongRef[]
  /**
   * 同一 run 内连续计划最终失败次数（达到 PLAN_FAILURE_LIMIT 收台）。
   * 可选以兼容 TT-1 之前构造的会话对象（缺省按 0 计）；createSession 始终初始化为 0。
   */
  consecutivePlanFailures?: number
}

/** 页面视图（toView 输出）。 */
export interface SessionView extends SessionState {
  remaining: number
  path: Array<SessionPathItem & { isCurrent: boolean }>
}

/** 半径收敛：夹取到 [10, 90]，非数值回退默认 35。 */
export const clampRadius = (radius: number): number => {
  if (!Number.isFinite(Number(radius))) return RADIUS_DEFAULT
  return Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, Math.round(Number(radius))))
}

/**
 * 创建会话：active=true，半径/指令可选（半径按边界收敛），连续失败计数归零。
 * 收台后重开 = 全新 run（D7/AC4）：不接收任何旧 run 状态，约束/正负艺人/推荐与路径全部归零，
 * 半径由调用方传设置默认（session.ts 传 appSetting['recommend.radius']）；
 * run 级字段沿用只发生在跟歌重锚（reanchorSession），不经由本函数。
 */
export const createSession = (anchor: SessionAnchor, options: { radius?: number, instruction?: string } = {}): SessionState => {
  return {
    active: true,
    anchor,
    radius: clampRadius(options.radius ?? RADIUS_DEFAULT),
    instruction: String(options.instruction ?? ''),
    positiveArtists: [],
    negativeArtists: [],
    recommendedIds: [],
    path: [],
    likedTracks: [],
    dislikedTracks: [],
    consecutivePlanFailures: 0,
  }
}

/**
 * 跟歌重锚（D2/D7）：单次切歌等价于“收旧台开新台，策略沿用”——
 * run 级字段（radius/instruction/正负艺人/连续计划失败计数）原样继承，
 * 锚点替换为新歌，recommendedIds/path/likedTracks 清空归零。
 */
export const reanchorSession = (state: SessionState, newAnchor: SessionAnchor): SessionState => {
  return {
    ...state,
    anchor: newAnchor,
    recommendedIds: [],
    path: [],
    likedTracks: [],
  }
}

/** 记录一次计划最终失败（续补重试中不算，重试耗尽或 initial 失败才算；计数在 run 内跨重锚延续）。 */
export const recordPlanFailure = (state: SessionState): SessionState => {
  return { ...state, consecutivePlanFailures: (state.consecutivePlanFailures ?? 0) + 1 }
}

/** 任一计划成功即清零连续失败计数（已为 0 时返回原对象，避免无意义的新引用）。 */
export const recordPlanSuccess = (state: SessionState): SessionState => {
  return state.consecutivePlanFailures ? { ...state, consecutivePlanFailures: 0 } : state
}

/** 连续计划最终失败达到上限 → 应收台（D13 收台触发集之一）。 */
export const shouldEndRun = (state: SessionState): boolean => {
  return (state.consecutivePlanFailures ?? 0) >= PLAN_FAILURE_LIMIT
}

/** 独立追加（不重复）一个艺人到列表。 */
const pushArtist = (list: string[], artist: string): string[] => {
  const name = String(artist ?? '').trim()
  if (!name) return list
  return list.includes(name) ? list : [...list, name]
}

/** 更新探索距离（滑杆；按边界收敛）。 */
export const updateRadius = (state: SessionState, radius: number): SessionState => {
  return { ...state, radius: clampRadius(radius) }
}

/** 更新一句话约束（原样保存，续补时拼接）。 */
export const updateInstruction = (state: SessionState, instruction: string): SessionState => {
  return { ...state, instruction: String(instruction ?? '') }
}

/**
 * 锚点分析作废判定（D3）：会话当前一句话约束（st.instruction 为用户原样输入，
 * 不含反馈拼接的续补指令）与「缓存分析产出时所用的约束快照」不一致 → 分析作废，
 * 下一次计划须重新解读锚点（编排层不再传 reuseAnalysis，引擎自动重新分析，召回方向随新约束换道）。
 * 快照缺失（首轮尚无缓存分析 / 旧会话对象）按不作废处理：首轮本就没有分析可复用，无需重复判废。
 * 快照由编排层（session.ts）与 analysisCache 同生命周期持有，不放进会话状态：
 * 收台/重锚会清空分析缓存，若快照作为 run 字段被 reanchorSession 沿用会留下与缓存不对应的假快照。
 */
export const analysisStale = (state: SessionState | null, analysisInstruction?: string | null): boolean => {
  if (analysisInstruction == null) return false
  return String(state?.instruction ?? '') !== String(analysisInstruction ?? '')
}

const sameIdentitySimplified = (a: SongIdentity, b: SongIdentity): boolean => {
  const right = songRefs(b)
  return songRefs(a).some(left => right.some(ref => sameSongSimplified(left, ref)))
}

/**
 * 反馈转移：far → 半径减 8（下限 10）+ 当前艺人入 negativeArtists（仅旧引擎的半径语义）；
 * good → 半径不变 + 当前艺人入 positiveArtists；
 * dislike → 当前曲目入会话级「不再推荐」列表（同曲去重；与收藏无关，不修改播放队列）。
 * 反馈只影响策略（后续续补），不跳过当前歌（path/recommendedIds 不动）。
 */
export const applyFeedback = (state: SessionState, kind: FeedbackKind, artist: string, track?: SongIdentity): SessionState => {
  if (kind === 'far') {
    return {
      ...state,
      radius: clampRadius(state.radius - FEEDBACK_RADIUS_STEP),
      negativeArtists: pushArtist(state.negativeArtists, artist),
    }
  }
  const currentLiked = state.likedTracks ?? []
  if (kind === 'dislike') {
    const trackIdentity: SongIdentity = { ...track, artist: track?.artist ?? artist }
    const dislikedTracks = [...state.dislikedTracks]
    const refs = songRefs(trackIdentity)
    for (const { artist: sourceArtist, title } of refs) {
      if (!String(title ?? '').trim()) continue
      // 保留每个来源的艺人证据；按 sameSong 去重会因共享合作者误丢另一主艺人写法。
      if (dislikedTracks.some(item => item.artist === sourceArtist && item.title === title)) continue
      dislikedTracks.push({ artist: sourceArtist, title })
    }
    // 严格互斥（含繁简归一）：标记不再推荐时清除该曲的已喜欢记录
    const likedTracks = refs.some(r => String(r.title ?? '').trim())
      ? currentLiked.filter(item => !sameIdentitySimplified(item, trackIdentity))
      : currentLiked
    if (dislikedTracks.length === state.dislikedTracks.length && likedTracks.length === currentLiked.length) return state
    return { ...state, likedTracks, dislikedTracks }
  }
  const trackIdentity: SongIdentity | null = track ? { ...track, artist: track.artist ?? artist } : null
  const refs = trackIdentity ? songRefs(trackIdentity).filter(r => String(r.title ?? '').trim()) : []
  const likedTracks = [...currentLiked]
  for (const { artist: sourceArtist, title } of refs) {
    if (likedTracks.some(item => item.artist === sourceArtist && item.title === title)) continue
    likedTracks.push({ artist: sourceArtist, title })
  }
  // 严格互斥（含繁简归一）：标记喜欢时清除该曲的不再推荐记录
  const dislikedTracks = trackIdentity && refs.length
    ? state.dislikedTracks.filter(item => !sameIdentitySimplified(item, trackIdentity))
    : state.dislikedTracks
  return {
    ...state,
    positiveArtists: pushArtist(state.positiveArtists, artist),
    likedTracks,
    dislikedTracks,
  }
}

/** 追加本次计划推荐的候选 id（去重）。 */
export const addRecommendedIds = (state: SessionState, ids: string[]): SessionState => {
  const seen = new Set(state.recommendedIds)
  const added: string[] = []
  for (const id of ids) {
    const key = String(id ?? '')
    if (!key || seen.has(key)) continue
    seen.add(key)
    added.push(key)
  }
  return added.length ? { ...state, recommendedIds: [...state.recommendedIds, ...added] } : state
}

/**
 * 追加/更新路径条目：同 id 或同曲（sameSong，同曲不同 id 变体）只保留一条
 * （planned 更新为 played 时位置不变，字段取后来传入的 item）；
 * 超出 MAX_PATH 裁掉最旧条目。无 id 且非同曲条目按追加处理。
 * 批次继承：新 item 带 batch 用新值，否则继承既有条目的 batch
 * （保证切歌回写 played 时批次快照不丢失）。
 */
type PathEntryLike = SongIdentity & {
  album?: string | null
  interval?: string | null
  intervalSec?: number | null
}

const collectRecordings = (item: PathEntryLike): Array<{ artist: string, title: string, album: string | null, intervalSec: number | null }> => {
  const out: Array<{ artist: string, title: string, album: string | null, intervalSec: number | null }> = []
  const unwrapped = unwrapMusicInfo(item.musicInfo)
  const topArtist = String(item.artist ?? '').trim()
  const topTitle = String(item.title ?? '').trim()
  if (topArtist && topTitle) {
    out.push({
      artist: topArtist,
      title: topTitle,
      album: item.album ?? unwrapped?.meta?.albumName ?? null,
      intervalSec: item.intervalSec ?? parseIntervalSec(item.interval ?? unwrapped?.interval),
    })
  }
  for (const info of musicInfosOf(item)) {
    const artist = String(info.singer ?? '').trim()
    const title = String(info.name ?? '').trim()
    if (!artist || !title) continue
    out.push({
      artist,
      title,
      album: info.meta?.albumName ?? null,
      intervalSec: parseIntervalSec(info.interval),
    })
  }
  return out
}

const looseRecordingMatch = (
  ra: { artist: string, title: string, intervalSec: number | null },
  rb: { artist: string, title: string, intervalSec: number | null },
): boolean => {
  if (!sameSong(ra, rb)) return false
  if (ra.intervalSec != null && rb.intervalSec != null) {
    return Math.abs(ra.intervalSec - rb.intervalSec) <= SEED_MATCH_DURATION_TOLERANCE_SEC
  }
  return true
}

/** 严格路径匹配（同 ID 或繁简双向严格同录音，不含宽松合作者回退；供切歌/删曲决策防误切不同录音）。 */
export const isStrictPathMatch = (a: PathEntryLike, b: PathEntryLike): boolean => {
  const aRefs = songRefs(a)
  const bRefs = songRefs(b)
  if (aRefs.some(left => left.id != null && bRefs.some(ref => ref.id === left.id))) return true
  const aRecs = collectRecordings(a)
  const bRecs = collectRecordings(b)
  return aRecs.some(ra => bRecs.some(rb => isStrictSameRecording(ra, rb, { simplifyChinese: true })))
}

/** 路径与队列条目的统一归并判定：覆盖全部保留来源 ID、繁简双向严格同录音，并在同对录音上校验时长防跨对污染。 */
export const samePathEntry = (a: PathEntryLike, b: PathEntryLike): boolean => {
  if (isStrictPathMatch(a, b)) return true
  const aRecs = collectRecordings(a)
  const bRecs = collectRecordings(b)
  return aRecs.some(ra => bRecs.some(rb => looseRecordingMatch(ra, rb)))
}

export const appendToPath = (state: SessionState, item: SessionPathItem): SessionState => {
  // 后到的来源证据（含繁简跨源同录音换源）可能连接多个旧条目；O(N) 找出所有与新项同曲/同录音的旧条目整组归并，保留最早路径位置。
  const existingItems = state.path.filter(p => samePathEntry(p, item))
  let path: SessionPathItem[]
  if (existingItems.length) {
    const existing = existingItems[0]
    const index = state.path.indexOf(existing)
    const musicInfo = item.musicInfo ?? existingItems.find(p => p.musicInfo)?.musicInfo
    const alternatives = uniqueMusicInfos([
      musicInfo,
      ...existingItems.flatMap(p => [p.musicInfo, ...(p.alternativeMusicInfos ?? [])]),
      ...(item.alternativeMusicInfos ?? []),
    ].filter((info): info is LX.Music.MusicInfoOnline => info != null)).filter(info => info !== musicInfo)
    path = state.path.filter(p => !existingItems.includes(p))
    path.splice(index, 0, {
      ...item,
      batch: item.batch ?? existing.batch,
      recommendSources: item.recommendSources ?? existingItems.find(p => p.recommendSources?.length)?.recommendSources,
      picUrl: item.picUrl ?? existingItems.find(p => p.picUrl)?.picUrl ?? null,
      interval: item.interval ?? existingItems.find(p => p.interval)?.interval ?? null,
      musicInfo,
      alternativeMusicInfos: alternatives.length ? alternatives : undefined,
    })
  } else {
    path = [...state.path, item]
  }
  if (path.length > MAX_PATH) path = path.slice(path.length - MAX_PATH)
  return { ...state, path }
}

/**
 * 批次身份 key：由批次快照三元组（radius/instruction/engine）派生，
 * 兼作路径分组的连续判定与视图 v-for 的稳定 key；无批次为 null。
 */
export const batchKey = (batch?: PathBatch | null): string | null => {
  if (!batch) return null
  return `${batch.radius}|||${batch.instruction}|||${batch.engine}`
}

/** 路径批次分组结果：batch 为该组的批次快照（全列表无批次时为 null）。 */
export interface PathBatchGroup<T> {
  /** v-for 稳定 key（含组序号，非连续的同批次值也不会撞 key）。 */
  key: string
  batch: PathBatch | null
  items: T[]
}

/**
 * 路径按批次分组（视图只负责 i18n 组头文案）：
 * - 连续相同 batchKey 的条目并为一组，批次变化开新组；
 * - 无 batch 条目并入上一组（组内保持原相对顺序）；
 * - 整条列表都无 batch 时输出单个 batch:null 组（视图组头回落「—」）；
 * - 头部无 batch 孤儿（其后存在批次）并入第一个批次组，仍在最前。
 * 空列表返回空数组。
 */
export const groupPathByBatch = <T extends { batch?: PathBatch }>(items: T[]): Array<PathBatchGroup<T>> => {
  const groups: Array<PathBatchGroup<T>> = []
  const leadingOrphans: T[] = []
  const anyBatch = items.some(item => item.batch != null)
  let lastKey: string | null = null
  for (const item of items) {
    const key = batchKey(item.batch)
    if (key == null) {
      if (groups.length) groups[groups.length - 1].items.push(item)
      else if (anyBatch) leadingOrphans.push(item)
      else groups.push({ key: '', batch: null, items: [item] })
      continue
    }
    if (key !== lastKey) {
      groups.push({ key: '', batch: item.batch ?? null, items: [] })
      lastKey = key
    }
    groups[groups.length - 1].items.push(item)
  }
  if (leadingOrphans.length && groups.length) {
    groups[0].items = [...leadingOrphans, ...groups[0].items]
  }
  return groups.map((group, gi) => ({ ...group, key: `${gi}-${batchKey(group.batch) ?? ''}` }))
}

/**
 * 续补判断：队列中剩余的“会话推荐”不超过 minQueueSize 时返回 true。
 * outstandingRecommendedIds 为「会话推荐 id ∩ 当前稍后播放列表」的统计结果。
 */
export const computeRefillNeed = (outstandingRecommendedIds: string[], minQueueSize: number = REFILL_THRESHOLD): boolean => {
  const counted = (Array.isArray(outstandingRecommendedIds) ? outstandingRecommendedIds : []).filter(id => String(id ?? '') !== '').length
  return counted <= Math.max(0, Number(minQueueSize) || REFILL_THRESHOLD)
}

/**
 * 反馈拼接成一句续补指令（positive 在前、negative 在后）；
 * 无反馈返回空串。由调用方与用户约束拼接后传给 exploreOnce 的 instruction。
 * negative 用「不要 + 空格」而非全角冒号：judgment.negativeFromInstruction 的
 * 捕获组不排除全角冒号，冒号会粘进第一个艺人的词元导致排除失效。
 */
export const buildReplanInstruction = (state: SessionState): string => {
  const parts = [
    state.positiveArtists.length ? `近一点的方向：${state.positiveArtists.join('、')}` : '',
    state.negativeArtists.length ? `不要 ${state.negativeArtists.join('、')}` : '',
  ].filter(Boolean)
  return parts.join('；')
}

/**
 * 切歌判定入参的新歌信息：
 * 优先按已知 id（recommendedIds / anchor / path）判定；
 * 若遇到陌生跨源 id（例如同曲换源或锚点版本切换）且提供元数据，则仅经严格录音匹配（isStrictSameRecording）识别，
 * 绝不经宽松 sameSong 合作者交集误判。仅含 id 的最小形状保持完全兼容。
 */
export interface SongChangeSong {
  /** 新歌 id（decideOnSongChange 内字符串化后判定；null/undefined 视为无有效新歌）。 */
  id?: string | null
  singer?: string | null
  name?: string | null
  artist?: string | null
  title?: string | null
  album?: string | null
  intervalSec?: number | null
  musicInfo?: LX.Music.MusicInfo
  alternativeMusicInfos?: LX.Music.MusicInfoOnline[]
}

/** 切歌判定入参。是否为“路径内”由本函数统一判定（口径统一在此，调用方不再各自判断）。 */
export interface DecideOnSongChangeArgs {
  /** 电台总开关（appSetting['recommend.radio']）。 */
  radioEnabled: boolean
  /** 当前新歌；null 或 id 无效表示无有效播放歌曲。 */
  song: SongChangeSong | null
}

/**
 * 切歌判定输出。
 * - on-path：新歌在本会话路径上 → 记听/按需续补；
 * - ignore：不动作（电台关且不在路径上、无会话、无有效新歌、或当前锚点同录音换源确认）；
 * - start：电台开且无会话 → 以新歌开台；
 * - reanchor：跟歌重锚，clearIds 为本会话已推荐 id（清场范围），
 *   该分支语义永远独立于任何队列清空概念——切歌伴随清空以重锚为准（D13/B7-C1 裁决）。
 */
export interface SongChangeDecision {
  kind: 'reanchor' | 'start' | 'on-path' | 'ignore'
  clearIds: string[]
}

const collectSongIds = (song: SongChangeSong | null): Set<string> => {
  const ids = new Set<string>()
  if (!song) return ids
  if (song.id != null && String(song.id) !== '') ids.add(String(song.id))
  for (const ref of songRefs(song)) {
    if (ref.id != null && String(ref.id) !== '') ids.add(String(ref.id))
  }
  return ids
}

const unwrapMusicInfo = (info?: LX.Music.MusicInfo | LX.Download.ListItem | null): LX.Music.MusicInfo | undefined => {
  if (!info) return undefined
  return 'progress' in info ? info.metadata.musicInfo : info
}

const matchesStrictRecording = (
  incoming: { artist: string, title: string, album?: string | null, intervalSec?: number | null },
  target: SongIdentity & { album?: string | null, intervalSec?: number | null, interval?: string | null },
): boolean => {
  for (const rec of collectRecordings(target)) {
    if (isStrictSameRecording(rec, incoming, { simplifyChinese: true })) return true
  }
  return false
}

/** 切歌判定（D2）：电台化后由本函数统一给出去向，编排层只负责执行。 */
export const decideOnSongChange = (
  state: SessionState | null,
  args: DecideOnSongChangeArgs,
): SongChangeDecision => {
  const songId = args.song?.id != null ? String(args.song.id) : ''
  const candidateIds = collectSongIds(args.song)

  let onPath = false
  let matchesAnchor = false
  if (state && candidateIds.size > 0) {
    const recSet = new Set(state.recommendedIds.map(String))
    onPath = [...candidateIds].some(id => recSet.has(id) || state.path.some(p => songRefs(p).some(ref => ref.id === id)))
    if (!onPath) {
      const anchorIds = new Set<string>()
      if (state.anchor.id != null && String(state.anchor.id) !== '') anchorIds.add(String(state.anchor.id))
      for (const ref of songRefs(state.anchor)) {
        if (ref.id != null) anchorIds.add(String(ref.id))
      }
      matchesAnchor = [...candidateIds].some(id => anchorIds.has(id))
    }
    if (!onPath && !matchesAnchor && args.song) {
      const incomingArtist = String(args.song.singer ?? args.song.artist ?? args.song.musicInfo?.singer ?? '').trim()
      const incomingTitle = String(args.song.name ?? args.song.title ?? args.song.musicInfo?.name ?? '').trim()
      if (incomingArtist && incomingTitle) {
        const incoming = {
          artist: incomingArtist,
          title: incomingTitle,
          album: args.song.album ?? args.song.musicInfo?.meta?.albumName ?? null,
          intervalSec: args.song.intervalSec ?? parseIntervalSec(args.song.musicInfo?.interval),
        }
        if (state.path.some(p => matchesStrictRecording(incoming, p))) {
          onPath = true
        } else if (matchesStrictRecording(incoming, state.anchor)) {
          matchesAnchor = true
        }
      }
    }
  }

  // 电台关：维持“从此歌出发”手动会话的现状语义——路径内记听，路径外不自动续补
  if (!args.radioEnabled) return { kind: onPath ? 'on-path' : 'ignore', clearIds: [] }
  // 电台开但无有效新歌：无从开台/重锚
  if (!songId) return { kind: 'ignore', clearIds: [] }
  // 电台开且无会话：等首切歌开台（含启动恢复经 playList 派发的首个 musicToggled，D15）
  if (!state) return { kind: 'start', clearIds: [] }
  if (onPath) return { kind: 'on-path', clearIds: [] }
  // 锚点同录音换源/版本确认：保持当前会话与待播队列，不触发重锚
  if (matchesAnchor) return { kind: 'ignore', clearIds: [] }
  return { kind: 'reanchor', clearIds: [...state.recommendedIds] }
}

// ============================ TT-4 本地指标（D9/D14） ============================

/** 30 秒跳过率的判定时长（秒）：以 play/pause 事件累计的实际播放秒数为准，不取切歌墙钟间隙（墙钟会把暂停误计为播放时长）。 */
export const SKIP_JUDGE_SECONDS = 30

/**
 * 播放时长累计器状态（纯数据，转移函数返回新对象）。
 * 生命周期 = 单曲目：编排层在切歌结算上一首后直接换新零态（清零），
 * 状态机本身不提供 reset 事件，避免与 trackEnd 结算语义纠缠。
 */
export interface PlayTimeState {
  /** 是否处于播放中（play 后、pause/trackEnd 前）。 */
  playing: boolean
  /** 在途分段起点（毫秒时间戳；非播放中为 null）。 */
  lastTs: number | null
  /** 已结算的分段合计（毫秒，不含在途分段）。 */
  totalMs: number
}

/** 时长累计器事件：play/pause 来自播放器，trackEnd 为切歌/停止时的结算事件。 */
export type PlayTimeEvent = 'play' | 'pause' | 'trackEnd'

/** 零态播放时长累计器（新曲目从 0 起计）。 */
export const createPlayTimeState = (): PlayTimeState => ({ playing: false, lastTs: null, totalMs: 0 })

/**
 * 播放时长累计转移（不可变）：
 * - play：开始/延续在途分段；播放中重复 play 仅重新锚定起点（先结算到 ts 再开口子），
 *   不重复计时——自然接续切歌常无独立 pause 事件，编排层会按 isPlay 先开口子、
 *   随后播放器的 onPlaying 事件再来一次 play，两次必须等价于一次；
 * - pause/trackEnd：结算在途分段并停表（暂停区间与缓冲等待不计入播放时长）；
 * 防御：时钟回拨的负增量按 0 计；非法 ts（非有限数）与未知事件原样返回，不污染已有时长。
 */
export const accumulatePlayTime = (state: PlayTimeState | null | undefined, event: PlayTimeEvent | string, ts?: number): PlayTimeState => {
  const st = state ?? createPlayTimeState()
  const t = Number(ts)
  if (!Number.isFinite(t)) return st
  // 结算在途分段（pause/trackEnd 及重复 play 共用）：负增量截断为 0
  const settledMs = st.playing && st.lastTs != null ? st.totalMs + Math.max(0, t - st.lastTs) : st.totalMs
  switch (event) {
    case 'play':
      // 已在播放：等价于“结算到此刻再从此刻续播”，吸收重复 play 事件
      return { playing: true, lastTs: t, totalMs: settledMs }
    case 'pause':
    case 'trackEnd':
      if (!st.playing) return st
      return { playing: false, lastTs: null, totalMs: settledMs }
    default:
      return st
  }
}

/** 读取已播放毫秒数：已结算分段合计 + 在途分段（播放中才计入；ts 非法时只回已结算部分）。 */
export const readPlayedMs = (state: PlayTimeState | null | undefined, ts?: number): number => {
  const st = state ?? createPlayTimeState()
  const t = Number(ts)
  if (st.playing && st.lastTs != null && Number.isFinite(t)) return st.totalMs + Math.max(0, t - st.lastTs)
  return st.totalMs
}

/** 续补批次登记（消费判定用）：批次内曲目 id 集合与是否已被消费。 */
export interface MetricsBatch {
  ids: string[]
  consumed: boolean
}

/**
 * 本地指标状态（D9 四计数器，纯 JSON 数据，即 data.ts 落盘的快照形状）：
 * - 30 秒跳过率：skippedUnder30s / recommendedEnded（recommendedStarted 供人读）；
 * - far/good 比：farCount / goodCount；
 * - run 存活：runCount / runTotalMs / lastRunDurationMs（runStartTs 为在途 run 起点，内部记账）；
 * - 续补消费比：consumedBatches / plannedBatches（batches 为批次→曲目登记，内部记账）。
 * 计数器单调非负；batches 不裁剪（批次量级小，长期增长可忽略，裁剪会牺牲口径一致性）。
 */
export interface MetricsState {
  /** 推荐曲播放不足 30 秒被切走次数（跳过率分子）。 */
  skippedUnder30s: number
  /** 推荐曲播放结束/被切走次数（跳过率分母）。 */
  recommendedEnded: number
  /** 推荐曲开始播放次数（供人读，不参与比率）。 */
  recommendedStarted: number
  /** “太远了”反馈次数。 */
  farCount: number
  /** “就这个方向”反馈次数。 */
  goodCount: number
  /** 累计开台 run 数（重锚沿用同一 run，不计）。 */
  runCount: number
  /** 已结算 run 的时长累计（毫秒；在途 run 不计，收台才结算）。 */
  runTotalMs: number
  /** 最近一次结算的 run 时长（毫秒；从未结算为 null）。 */
  lastRunDurationMs: number | null
  /** 计划批次数（initial 与 refill 均计——消费比的信息目标是“推荐的批次有没有被听”）。 */
  plannedBatches: number
  /** 被消费过的批次数（同批任一曲目进入已播记一次，一批仅记一次）。 */
  consumedBatches: number
  /** 在途 run 起点时间戳（毫秒；收台清空。水合时恒归 null：重启不结算半截 run）。 */
  runStartTs: number | null
  /** 批次 key → 登记信息（key 与路径分组的 batchKey 同源）。 */
  batches: Record<string, MetricsBatch>
}

/**
 * 指标事件（编排层在事件点构造，字段宽松、reducer 内归一）：
 * - trackStarted：新曲目进入已播；recommended 由编排层按切换时的 on-path 判定给出，
 *   id 用于批次消费判定（同批任一 id 命中即记该批被消费一次）；
 * - trackEnded：曲目被切走/播完；recommendedId 由编排层判定（非推荐传空/null），
 *   playedSeconds 为 play/pause 累计的实际播放秒数（由编排层用时长安置器结算）；
 * - feedback：far/good 反馈；
 * - runStarted/runEnded：run 边界（开台/收台），重锚不算 run 边界（D7 沿用）；
 * - refillPlanned：一次计划完成登记批次，batchKey 与 batch→ids 映射一并给出。
 */
export type MetricsEvent =
  | { type: 'trackStarted', id?: string | null, recommended?: boolean }
  | { type: 'trackEnded', recommendedId?: string | null, playedSeconds?: number }
  | { type: 'feedback', kind?: FeedbackKind | string }
  | { type: 'runStarted', ts?: number }
  | { type: 'runEnded', ts?: number }
  | { type: 'refillPlanned', batchKey?: string | null, ids?: Array<string | null | undefined> | null }

/** 零态指标状态（首装/快照缺失的水合兜底）。 */
export const createMetricsState = (): MetricsState => ({
  skippedUnder30s: 0,
  recommendedEnded: 0,
  recommendedStarted: 0,
  farCount: 0,
  goodCount: 0,
  runCount: 0,
  runTotalMs: 0,
  lastRunDurationMs: null,
  plannedBatches: 0,
  consumedBatches: 0,
  runStartTs: null,
  batches: {},
})

/** 归一为非负整数计数：非有限数/负数按 0 计（垃圾快照不污染比率）。 */
const toCount = (value: unknown): number => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/** 归一为可选时间戳：有限数才有效（用于在途 run 起点）。 */
const toTs = (value: unknown): number | null => {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** 归一曲目 id/批次 key：字符串化并去空。 */
const toTrackId = (value: unknown): string => {
  if (value == null) return ''
  return String(value)
}

/** 归一曲目 id 列表：字符串化、去空、去重。 */
const toTrackIds = (values: unknown): string[] => {
  if (!Array.isArray(values)) return []
  const seen = new Set<string>()
  const ids: string[] = []
  for (const value of values) {
    const id = toTrackId(value)
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

/** trackStarted：推荐开始计数 + 批次消费判定（同批任一 id 命中即记一次，一批仅记一次；同一 id 命中多个未消费批次时各记一次）。 */
const reduceTrackStarted = (state: MetricsState, event: Extract<MetricsEvent, { type: 'trackStarted' }>): MetricsState => {
  const id = toTrackId(event.id)
  let batches = state.batches
  let consumedDelta = 0
  if (id) {
    for (const [key, batch] of Object.entries(state.batches)) {
      if (batch.consumed || !batch.ids.includes(id)) continue
      if (!consumedDelta) batches = { ...state.batches }
      batches[key] = { ...batch, consumed: true }
      consumedDelta++
    }
  }
  const startedDelta = event.recommended === true ? 1 : 0
  // 无变化返回原引用（与 recordPlanSuccess 先例一致：避免无意义的新引用）
  if (!consumedDelta && !startedDelta) return state
  return {
    ...state,
    batches,
    consumedBatches: state.consumedBatches + consumedDelta,
    recommendedStarted: state.recommendedStarted + startedDelta,
  }
}

/** trackEnded：仅统计推荐曲（归属由编排层判定）；playedSeconds 垃圾值按 0 计（未知即短播，偏保守地计入跳过分子）。 */
const reduceTrackEnded = (state: MetricsState, event: Extract<MetricsEvent, { type: 'trackEnded' }>): MetricsState => {
  const recommendedId = toTrackId(event.recommendedId)
  if (!recommendedId) return state
  const played = Number(event.playedSeconds)
  const seconds = Number.isFinite(played) && played > 0 ? played : 0
  return {
    ...state,
    recommendedEnded: state.recommendedEnded + 1,
    skippedUnder30s: state.skippedUnder30s + (seconds < SKIP_JUDGE_SECONDS ? 1 : 0),
  }
}

/** runStarted：如实 +1 并重置在途起点（编排层保证只在 run 边界注入；重复注入按新 run 宽松处理）；ts 缺失/非法时起点归 null——该 run 时长未知，收台时无法结算也不臆造（见 reduceRunEnded）。 */
const reduceRunStarted = (state: MetricsState, event: Extract<MetricsEvent, { type: 'runStarted' }>): MetricsState => {
  return { ...state, runCount: state.runCount + 1, runStartTs: toTs(event.ts) }
}

/** runEnded：结算在途 run 时长（runStartTs 为 null——无在途 run 或起点未知的半截 run——均不动作：前者收台幂等，后者无可靠时长可结算）；时钟回拨的负时长按 0 计。 */
const reduceRunEnded = (state: MetricsState, event: Extract<MetricsEvent, { type: 'runEnded' }>): MetricsState => {
  if (state.runStartTs == null) return state
  const ts = toTs(event.ts)
  const duration = ts == null ? 0 : Math.max(0, ts - state.runStartTs)
  return {
    ...state,
    runStartTs: null,
    runTotalMs: state.runTotalMs + duration,
    lastRunDurationMs: duration,
  }
}

/** refillPlanned：一次计划一次计数；同 key 重登记时覆盖为最新曲目集合（新计划取代旧批次的消费判定语义）。 */
const reduceRefillPlanned = (state: MetricsState, event: Extract<MetricsEvent, { type: 'refillPlanned' }>): MetricsState => {
  const key = toTrackId(event.batchKey)
  if (!key) return state
  return {
    ...state,
    plannedBatches: state.plannedBatches + 1,
    batches: { ...state.batches, [key]: { ids: toTrackIds(event.ids), consumed: false } },
  }
}

/**
 * 指标事件归并 reducer（不可变转移：返回新对象；无法归并的事件返回原引用）。
 * 计数口径全部收敛在本函数，编排层只在事件点构造事件、不做计数判断。
 */
export const reduceMetrics = (state: MetricsState | null | undefined, event: MetricsEvent | null | undefined): MetricsState => {
  const st = state ?? createMetricsState()
  if (event == null) return st
  switch (event.type) {
    case 'trackStarted': return reduceTrackStarted(st, event)
    case 'trackEnded': return reduceTrackEnded(st, event)
    case 'feedback':
      if (event.kind === 'far') return { ...st, farCount: st.farCount + 1 }
      if (event.kind === 'good') return { ...st, goodCount: st.goodCount + 1 }
      return st
    case 'runStarted': return reduceRunStarted(st, event)
    case 'runEnded': return reduceRunEnded(st, event)
    case 'refillPlanned': return reduceRefillPlanned(st, event)
    default: return st
  }
}

/**
 * 快照水合（宽松归一）：落盘 JSON 可能是旧版本/损坏数据——有效字段保留、垃圾字段缺省补齐；
 * 在途 runStartTs 恒丢弃（应用退出期间不产生收台事件，半截 run 的墙钟时长无意义，不结算）；
 * 水合结果可直接继续 reduce 事件，重启后计数在旧值上续增（AC7）。
 */
export const hydrateMetrics = (raw: unknown): MetricsState => {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return createMetricsState()
  const obj = raw as Record<string, unknown>
  const batches: Record<string, MetricsBatch> = {}
  if (obj.batches != null && typeof obj.batches === 'object' && !Array.isArray(obj.batches)) {
    for (const [key, value] of Object.entries(obj.batches as Record<string, unknown>)) {
      if (key === '' || value == null || typeof value !== 'object') continue
      const batch = value as Record<string, unknown>
      batches[key] = { ids: toTrackIds(batch.ids), consumed: batch.consumed === true }
    }
  }
  return {
    skippedUnder30s: toCount(obj.skippedUnder30s),
    recommendedEnded: toCount(obj.recommendedEnded),
    recommendedStarted: toCount(obj.recommendedStarted),
    farCount: toCount(obj.farCount),
    goodCount: toCount(obj.goodCount),
    runCount: toCount(obj.runCount),
    runTotalMs: toCount(obj.runTotalMs),
    lastRunDurationMs: typeof obj.lastRunDurationMs === 'number' && Number.isFinite(obj.lastRunDurationMs) && obj.lastRunDurationMs >= 0 ? obj.lastRunDurationMs : null,
    plannedBatches: toCount(obj.plannedBatches),
    consumedBatches: toCount(obj.consumedBatches),
    runStartTs: null,
    batches,
  }
}

/** 页面视图：路径条目标记当前播放，附队列剩余计数。 */
export const toView = (state: SessionState, options: { currentId: string | null, remaining: number }): SessionView => {
  return {
    ...state,
    remaining: Math.max(0, Number(options.remaining) || 0),
    path: state.path.map(item => ({
      ...item,
      isCurrent: songRefs(item).some(ref => ref.id != null && String(ref.id) === String(options.currentId ?? '')),
    })),
  }
}
