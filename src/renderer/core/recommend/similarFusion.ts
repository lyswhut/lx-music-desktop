/**
 * 跨源相似候选合并与排名融合纯函数（平台相似推荐 4.3 + YouTube Music 三源融合）。
 *
 * - 候选保留作品身份 + 各来源条目（含排名与备用音源），不提前「保留第一条」丢证据；
 * - 等权倒数排名融合 Σ 1/(k + rank)（k 集中配置于 recommendationConfig）：
 *   仅用来源内排名，避免不同平台原始分数不可比；同源重复行/重试返回只计一次；
 * - 确定性：固定来源顺序（PROVIDER_ORDER）+ 同源先按 (rank, id, title, artist) 稳定排序
 *   + 稳定全序比较，确保首选录音、RRF 分数及 alternativeMusicInfos 顺序均与输入排列无关；
 * - YTM 票严格绑定已验证国内录音 ID（musicInfo.id），不经宽松 sameSong 合作者交集跨录音误合并；
 * - 本地画像加成是有界次级调整（默认 ±15%），保留来源排名的主要作用；
 * - 艺人多样性：同主艺人每批最多 maxPerArtist 首，不足一批允许少量结果，不补足数量。
 * 本模块无 lx 运行时依赖，由 vitest 直接测试。
 */

import { SIMILAR_FUSION_K } from '@common/recommendationConfig'
import { primaryArtistVariants } from './sameSong'
import { isStrictSameRecording, parseIntervalSec, SEED_MATCH_DURATION_TOLERANCE_SEC } from './seedMatch'
import { groupIdentities, musicInfosOf, sameIdentity, uniqueMusicInfos } from './songIdentity'

/** 平台提供方固定顺序（确定性合并的来源序，与异步完成顺序无关）。 */
export const PROVIDER_ORDER = ['wy', 'tx', 'ytm'] as const
export type SimilarProviderId = typeof PROVIDER_ORDER[number]

/** 单来源候选（平台返回的归一化条目，rank 为来源内排名，从 1 开始）。 */
export interface ProviderCandidate {
  musicInfo: LX.Music.MusicInfo
  rank: number
}

/** 单来源输入批次。 */
export interface ProviderBatch {
  provider: SimilarProviderId
  candidates: ProviderCandidate[]
}

/** 来源证据：提供方 + 来源内排名 + 该来源的可播放条目（备用音源）。 */
export interface CandidateSource {
  provider: SimilarProviderId
  rank: number
  musicInfo: LX.Music.MusicInfo
}

/** 融合后的候选：保留全部来源证据；musicInfo 为首选播放条目（按 PROVIDER_ORDER 取最早来源）。 */
export interface FusedCandidate {
  artist: string
  title: string
  album: string
  /** 各来源证据（按 PROVIDER_ORDER 排序；同一候选跨源合并后仍保留各自排名与条目）。 */
  sources: CandidateSource[]
  /** 首选播放条目（PROVIDER_ORDER 中最早的来源；推荐方不一定是最终播放源）。 */
  musicInfo: LX.Music.MusicInfo
  /** 所有保留的来源身份（含同平台归并条目），与每平台一次的排名贡献分开。 */
  alternativeMusicInfos: LX.Music.MusicInfo[]
  /** 融合分 Σ 1/(k + rank)（画像调整前）。 */
  fusionScore: number
}

/** 画像加成的有界调整幅度（localBonus ∈ [-10,+10] 映射为分数乘数最多 ±15%）。 */
const PROFILE_ADJUST_LIMIT = 0.15

/** 候选的最佳来源证据（排名最靠前；并列时取来源固定序靠前者）——全序比较的次级键。 */
const bestSource = (c: FusedCandidate): CandidateSource => {
  return c.sources.reduce((best, s) => {
    if (s.rank < best.rank) return s
    if (s.rank === best.rank && PROVIDER_ORDER.indexOf(s.provider) < PROVIDER_ORDER.indexOf(best.provider)) return s
    return best
  })
}

const compareStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/** 同源候选稳定预排序：消除同源重复录音输入顺序对首选条目与 alternativeMusicInfos 顺序的依赖。 */
const compareProviderCandidate = (a: ProviderCandidate, b: ProviderCandidate): number => {
  if (a.rank !== b.rank) return a.rank - b.rank
  const idCmp = compareStr(String(a.musicInfo.id ?? ''), String(b.musicInfo.id ?? ''))
  if (idCmp !== 0) return idCmp
  const titleCmp = compareStr(String(a.musicInfo.name ?? '').toLowerCase(), String(b.musicInfo.name ?? '').toLowerCase())
  if (titleCmp !== 0) return titleCmp
  return compareStr(String(a.musicInfo.singer ?? '').toLowerCase(), String(b.musicInfo.singer ?? '').toLowerCase())
}

/** 全序比较（确定性）：融合分降序 → 最佳来源排名升序 → 来源固定顺序 → 标题/艺人归一化字典序。 */
const compareFused = (a: FusedCandidate, b: FusedCandidate): number => {
  if (a.fusionScore !== b.fusionScore) return b.fusionScore - a.fusionScore
  const aBest = bestSource(a)
  const bBest = bestSource(b)
  if (aBest.rank !== bBest.rank) return aBest.rank - bBest.rank
  const aOrder = PROVIDER_ORDER.indexOf(aBest.provider)
  const bOrder = PROVIDER_ORDER.indexOf(bBest.provider)
  if (aOrder !== bOrder) return aOrder - bOrder
  const aKey = `${String(a.title).toLowerCase()}||${String(a.artist).toLowerCase()}`
  const bKey = `${String(b.title).toLowerCase()}||${String(b.artist).toLowerCase()}`
  return compareStr(aKey, bKey)
}

type RankedRecord = ProviderCandidate & { provider: SimilarProviderId, orderIndex: number }

const toRecording = (record: { musicInfo: LX.Music.MusicInfo }) => ({
  artist: record.musicInfo.singer,
  title: record.musicInfo.name,
  album: record.musicInfo.meta?.albumName ?? '',
  intervalSec: parseIntervalSec(record.musicInfo.interval),
})

const strictRecordingMatch = (a: RankedRecord, b: RankedRecord): boolean => {
  if (a.musicInfo.id != null && a.musicInfo.id === b.musicInfo.id) return true
  return isStrictSameRecording(toRecording(a), toRecording(b), { simplifyChinese: true })
}

const withinDurationTolerance = (a: RankedRecord, b: RankedRecord): boolean => {
  const aSec = parseIntervalSec(a.musicInfo.interval)
  const bSec = parseIntervalSec(b.musicInfo.interval)
  if (aSec == null || bSec == null) return true
  return Math.abs(aSec - bSec) <= SEED_MATCH_DURATION_TOLERANCE_SEC
}

/**
 * 跨源合并与融合：
 * - 第一阶段按既有规则归组国内源（wy/tx），保持同源 ID 与同曲归并语义；
 * - 第二阶段再将 YTM 候选按精确国内 ID 或双向严格同录音（含繁简统一）并入对应录音，
 *   既能让 wy 与桥接到 kw/tx 的同录音正常累加双源 RRF 票，又会在国内组存在宽松合作者混组时
 *   仅剥离严格同录音的成员与 YTM 合并，杜绝无关录音误享 YTM 票/徽章/备用音源；
 * - 每平台仅最佳排名计一次投票；融合分 Σ 1/(k + rank)；
 * - 输出（首选录音、RRF 分数与备用项顺序）与输入批次/行顺序无关。
 */
export const fuseSimilarCandidates = (batches: ProviderBatch[]): FusedCandidate[] => {
  const ordered = PROVIDER_ORDER
    .map(provider => batches.find(b => b.provider === provider))
    .filter((b): b is ProviderBatch => b != null)

  let orderIndex = 0
  const records: RankedRecord[] = ordered.flatMap(batch =>
    [...batch.candidates]
      .sort(compareProviderCandidate)
      .map(candidate => ({ ...candidate, provider: batch.provider, orderIndex: orderIndex++ })),
  )
  const domesticRecords = records.filter(record => record.provider !== 'ytm')
  const ytmRecords = records.filter(record => record.provider === 'ytm')

  let grouped: RankedRecord[][] = groupIdentities(
    domesticRecords,
    (a, b) => (a.provider === b.provider && a.musicInfo.id === b.musicInfo.id) || sameIdentity(a, b),
  )

  if (ytmRecords.length) {
    const ytmGroups = groupIdentities(ytmRecords, strictRecordingMatch)
    for (const ytmGroup of ytmGroups) {
      const nextGroups: RankedRecord[][] = []
      const merged: RankedRecord[] = [...ytmGroup]
      for (const group of grouped) {
        const matched: RankedRecord[] = []
        let unmatched: RankedRecord[] = []
        for (const member of group) {
          if (ytmGroup.some(y => strictRecordingMatch(member, y))) matched.push(member)
          else unmatched.push(member)
        }
        // 组内经严格同录音连接的别名变体（如 冯沁苑 ↔ 冯沁苑（买辣椒也用券））保留在同一组，
        // 同时要求与 YTM 录音本身无已知时长冲突，阻断 180s ↔ 194s ↔ 208s 链式漂移。
        if (matched.length && unmatched.length) {
          let expanded = true
          while (expanded && unmatched.length) {
            expanded = false
            const remaining: RankedRecord[] = []
            for (const candidate of unmatched) {
              if (
                matched.some(m => strictRecordingMatch(candidate, m)) &&
                ytmGroup.every(y => withinDurationTolerance(candidate, y))
              ) {
                matched.push(candidate)
                expanded = true
              } else {
                remaining.push(candidate)
              }
            }
            unmatched = remaining
          }
        }
        if (unmatched.length) nextGroups.push(unmatched)
        if (matched.length) merged.push(...matched)
      }
      merged.sort((a, b) => a.orderIndex - b.orderIndex)
      nextGroups.push(merged)
      grouped = nextGroups
    }
  }

  const groups = grouped.map((group): FusedCandidate => {
    const sources = PROVIDER_ORDER.flatMap(provider => {
      const candidates = group.filter(record => record.provider === provider)
      if (!candidates.length) return []
      return [candidates.reduce((best, record) => record.rank < best.rank ? record : best)]
    })
    const musicInfo = sources[0].musicInfo
    return {
      artist: musicInfo.singer,
      title: musicInfo.name,
      album: musicInfo.meta.albumName ?? '',
      sources,
      musicInfo,
      alternativeMusicInfos: uniqueMusicInfos(group.map(record => record.musicInfo)).filter(info => info !== musicInfo),
      fusionScore: sources.reduce((sum, source) => sum + 1 / (SIMILAR_FUSION_K + source.rank), 0),
    }
  })
  return groups.sort(compareFused)
}

/**
 * 有界画像调整：localBonus（[-10,+10]）映射为最多 ±15% 的分数乘数，来源排名仍主导顺序；
 * 调整后重排仍用 compareFused 的全序（分数变化才可能换位）。
 */
export const applyProfileAdjustment = (items: FusedCandidate[], profileBoost?: (artist: string) => number): FusedCandidate[] => {
  if (!profileBoost) return items
  const adjusted = items.map(item => {
    const bonus = Math.max(-10, Math.min(10, Number(profileBoost(item.artist ?? '')) || 0))
    const multiplier = 1 + (bonus / 10) * PROFILE_ADJUST_LIMIT
    return { ...item, fusionScore: item.fusionScore * multiplier }
  })
  return adjusted.sort(compareFused)
}

/**
 * 艺人多样性限制：按顺序保留同主艺人（首个艺人段及括号别名）最多 maxPerArtist 首，
 * 超出的本批不展示（不重排、不从无关来源补足数量）；不足一批允许少量结果。
 */
export const applyArtistDiversity = (items: FusedCandidate[], maxPerArtist = 2): FusedCandidate[] => {
  const primaries = items.map(item => {
    const variants = primaryArtistVariants(item.artist)
    return variants.length ? variants : ['']
  })
  const sourcePrimaries = items.flatMap(item => musicInfosOf(item).map(info => primaryArtistVariants(info.singer)))
  const groups = new Map<string, { variants: Set<string>, count: number }>()
  for (const variants of [...primaries, ...sourcePrimaries]) {
    const group = { variants: new Set(variants), count: 0 }
    for (const variant of variants) {
      for (const alias of groups.get(variant)?.variants ?? []) group.variants.add(alias)
    }
    for (const alias of group.variants) groups.set(alias, group)
  }
  return items.filter((_, index) => {
    const group = groups.get(primaries[index][0])!
    if (group.count >= maxPerArtist) return false
    group.count++
    return true
  })
}
