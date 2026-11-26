/**
 * 平台相似推荐引擎（默认路径，零 LLM）。
 *
 * 当前歌曲 → 各平台准确定位同曲 → 平台单曲相似推荐（网易 / QQ / YouTube Music）
 * → 跨源合并与排名融合 → 本地过滤、播放能力复核与偏好调整 → 稍后播放队列。
 *
 * 与旧 AI 引擎（engine.ts exploreOnce）的关系：
 * - 本路径为默认推荐路径，不要求 AI Key，全程 0 次 LLM 请求（分析/排序/画像摘要均不发起）；
 * - 平台全部失败时抛出携带本轮 providers 状态的 PlatformRecallFailedError 走会话层有限重试；
 * - 无匹配/空结果/过滤完/候选用尽/无可用国内播放源为可区分的非失败状态（不重试、不静默回退）；
 * - 旧 AI 路径仅经显式设置（recommend.engine='ai'）进入，不因本路径失败被自动触发。
 */

import { LIST_IDS } from '@common/constants'
import { addTempPlayList } from '@renderer/store/player/action'
import { tempPlayList } from '@renderer/store/player/state'
import { getListMusics } from '@renderer/store/list/listManage/rendererListManage'
import { loveList } from '@renderer/store/list/listManage/state'
import { hasDislike } from '@renderer/store/dislikeList/action'
import { recallPlatformSimilar } from './platformRecall'
import type { PlatformRecallAnchor, PlatformRecallState, ProviderCallStatus } from './platformRecall'
import type { FusedCandidate, SimilarProviderId } from './similarFusion'
import type { SongRef } from './sameSong'
import { musicInfosOf, songRefs } from './songIdentity'
import { filterForSubmission } from './submission'
import type { YtmAdapter } from './ytmAdapter'
import { DOMESTIC_BRIDGE_PROVIDERS, verifyYtmPlaybackSupport, type DomesticBridgeProvider } from './ytmBridge'

/** 平台提供方状态投影（供 UI 非阻断状态徽章与错误透传）。 */
export interface PlatformProviderStatus {
  provider: SimilarProviderId
  status: ProviderCallStatus
  seedId: string | null
  fromCache: boolean
  error?: string
}

/** 全部平台失败时的类型化异常：携带本轮 providers 状态，防止会话层残留上一轮成功绿徽章。 */
export class PlatformRecallFailedError extends Error {
  readonly code = 'PLATFORM_RECALL_ALL_FAILED' as const
  readonly providers: PlatformProviderStatus[]

  constructor(message: string, providers: PlatformProviderStatus[]) {
    super(message)
    this.name = 'PlatformRecallFailedError'
    this.providers = providers
  }
}

/** 平台推荐引擎选项。 */
export interface PlatformExploreOptions {
  anchor: PlatformRecallAnchor
  /** 会话先校验代际再提交队列（与 exploreOnce.enqueue 同语义）。 */
  enqueue?: boolean
  isCancelled?: () => boolean
  /** 队列追加模式：bottom=追加队尾（会话路径一律传此值）。 */
  appendMode?: 'top' | 'bottom'
  /** 本轮启用的推荐提供方列表。 */
  enabledProviders?: SimilarProviderId[]
  /** YouTube Music 网络适配器（启用 ytm 时注入）。 */
  ytmAdapter?: YtmAdapter
  /** 规范化代理上下文键（隔离 YTM 缓存与可达性状态）。 */
  ytmProxyContext?: string
  /** 当前经 assertPlaybackSupport 筛选的可播国内桥接源（严禁空能力盲目回落）。 */
  playableTargets?: DomesticBridgeProvider[]
  /** 是否允许 YTM 推荐条目在无国内可播源或国内未命中时直接以原生 `source: 'ytm'` 播放。 */
  allowDirectYtmPlayback?: boolean
  /** 入队提交前复核 YTM 桥接候选的当前播放能力。 */
  canPlaySource?: (source: LX.Source) => boolean
  /** 会话已推荐过的候选 id（续补避免重复入队）。 */
  excludeIds?: string[]
  /** 会话已推荐/已播曲目（同曲通道）。 */
  excludeTracks?: SongRef[]
  /** 明确「不再推荐」的曲目。 */
  dislikedTracks?: SongRef[]
  /** 本地画像艺人加成（有界次级调整）。 */
  profileBoost?: (artist: string) => number
  /** 单批最多入队数。 */
  maxItems?: number
}

/** 对外返回的单条候选视图（与 ExploreItemView 对齐的子集 + 来源证据）。 */
export interface PlatformItemView {
  id: string | null
  artist: string
  title: string
  album: string
  /** 展示来源：'wy' | 'tx' | 'ytm' | 'aggregated'（跨源共同推荐）。 */
  source: string
  /** 可验证事实理由（不生成未经测量的听感描述）。 */
  reason: string
  journeyRole: string
  musicInfo?: LX.Music.MusicInfoOnline
  alternativeMusicInfos?: LX.Music.MusicInfoOnline[]
  /** 各来源证据（含排名与备用音源条目）。 */
  sources: Array<{ provider: SimilarProviderId, rank: number, musicInfo: LX.Music.MusicInfoOnline }>
}

/** 平台推荐结果视图。 */
export interface PlatformExploreResult {
  engine: 'platform'
  anchor: { artist: string, title: string, album: string }
  candidates: PlatformItemView[]
  meta: {
    state: PlatformRecallState
    /** 各平台调用状态（部分来源不可用时供非阻断提示）。 */
    providers: PlatformProviderStatus[]
    error: string | null
  }
}

/** 平台展示名（理由/来源文案用）。 */
const PROVIDER_LABEL: Record<SimilarProviderId, string> = {
  wy: '网易相似歌曲推荐',
  tx: 'QQ 音乐相关歌曲推荐',
  ytm: 'YouTube Music 相关歌曲推荐',
}

const reasonForSources = (sources: FusedCandidate['sources']): string => {
  if (sources.length >= 3) return '三个平台共同推荐'
  if (sources.length === 2) return '两个平台共同推荐'
  return PROVIDER_LABEL[sources[0].provider] ?? '平台相似推荐'
}

/** 读取红心歌（排除用；失败时按空处理，不阻塞推荐）。 */
const gatherLovedTracks = async(): Promise<SongRef[]> => {
  try {
    const items = await getListMusics(loveList.id)
    return items.map(m => ({ artist: m.singer, title: m.name }))
  } catch {
    return []
  }
}

/** 候选 → 视图（理由只陈述可验证事实：来源与共同推荐，不编造听感描述）。 */
const toView = (item: FusedCandidate): PlatformItemView => {
  const aggregated = item.sources.length > 1
  return {
    id: item.musicInfo.id ?? null,
    artist: item.artist ?? '',
    title: item.title ?? '',
    album: item.album ?? '',
    source: aggregated ? 'aggregated' : item.sources[0].provider,
    reason: reasonForSources(item.sources),
    // 平台模式无弧线角色语义，占位 open（视图在平台模式隐藏角色徽章）
    journeyRole: 'open',
    musicInfo: item.musicInfo as LX.Music.MusicInfoOnline,
    alternativeMusicInfos: musicInfosOf(item).filter(info => info !== item.musicInfo) as LX.Music.MusicInfoOnline[],
    sources: item.sources.map(s => ({ provider: s.provider, rank: s.rank, musicInfo: s.musicInfo as LX.Music.MusicInfoOnline })),
  }
}

/**
 * 平台相似推荐一次计划：召回（种子定位 + 相似 + 融合 + 过滤）→ 播放能力复核 → 入队。
 * 全部平台失败时抛 PlatformRecallFailedError（会话层有限重试）；其余零候选状态以 meta.state 返回，不抛错。
 */
export const explorePlatformOnce = async(options: PlatformExploreOptions): Promise<PlatformExploreResult> => {
  const anchor = options.anchor
  if (options.isCancelled?.()) throw new Error('推荐计划已取消')

  const lovedTracks = await gatherLovedTracks()
  if (options.isCancelled?.()) throw new Error('推荐计划已取消')

  // 当前稍后播放队列（含用户手动排队；同曲不重复插入）
  const queueTracks: SongRef[] = []
  for (const item of tempPlayList) {
    queueTracks.push(...songRefs(item))
  }

  // 显式透传 playableTargets；若省略则仅从 canPlaySource 派生，绝不盲目回落全五源
  const playableTargets = options.playableTargets ??
    (options.canPlaySource ? DOMESTIC_BRIDGE_PROVIDERS.filter(source => options.canPlaySource!(source)) : undefined)

  const recall = await recallPlatformSimilar(anchor, {
    isCancelled: options.isCancelled,
    enabledProviders: options.enabledProviders,
    ytmAdapter: options.ytmAdapter,
    ytmProxyContext: options.ytmProxyContext,
    playableTargets,
    allowDirectYtmPlayback: options.allowDirectYtmPlayback,
    excludeIds: options.excludeIds,
    excludeTracks: options.excludeTracks,
    queueTracks,
    lovedTracks,
    dislikedTracks: options.dislikedTracks,
    isExcluded: hasDislike,
    profileBoost: options.profileBoost,
    maxItems: options.maxItems,
  })
  if (options.isCancelled?.()) throw new Error('推荐计划已取消')

  // 全部平台失败按请求失败处理（携带本轮 providers 状态走会话层有限重试；不静默回退其他召回）
  if (recall.state === 'all-failed') {
    throw new PlatformRecallFailedError(recall.error ?? '全部平台请求失败', recall.providers)
  }

  let result: PlatformExploreResult = {
    engine: 'platform',
    anchor: { artist: anchor.artist, title: anchor.title, album: anchor.album ?? '' },
    candidates: recall.items.map(toView),
    meta: {
      state: recall.state,
      providers: recall.providers,
      error: recall.error,
    },
  }
  if (options.enqueue !== false) {
    result = await filterForSubmission(result, {
      isCancelled: options.isCancelled,
      dislikedTracks: () => options.dislikedTracks ?? [],
    })
    const checked = verifyYtmPlaybackSupport(result.candidates, options.canPlaySource)
    result = { ...result, candidates: checked.kept }
    if (recall.items.length && !result.candidates.length) {
      result.meta.state = checked.droppedForPlayback > 0 ? 'no-playable-source' : 'empty-after-filter'
    }
  } else if (options.canPlaySource) {
    const checked = verifyYtmPlaybackSupport(result.candidates, options.canPlaySource)
    result = { ...result, candidates: checked.kept }
    if (recall.items.length && !result.candidates.length && checked.droppedForPlayback > 0) {
      result.meta.state = 'no-playable-source'
    }
  }
  if (options.enqueue !== false && result.candidates.length) {
    addTempPlayList(result.candidates.flatMap(item => item.musicInfo ? [{
      listId: LIST_IDS.PLAY_LATER,
      musicInfo: item.musicInfo,
      alternativeMusicInfos: item.alternativeMusicInfos,
      isTop: options.appendMode !== 'bottom',
    }] : []))
  }
  return result
}
