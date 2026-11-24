import { describe, expect, it } from 'vitest'
import { fuseSimilarCandidates, PROVIDER_ORDER, type ProviderBatch, type SimilarProviderId } from './similarFusion'
import {
  MAX_PATH,
  PLAN_FAILURE_LIMIT,
  addRecommendedIds,
  appendToPath,
  applyFeedback,
  createSession,
  decideOnSongChange,
  reanchorSession,
  recordPlanFailure,
  recordPlanSuccess,
  shouldEndRun,
  type SessionAnchor,
} from './session-core'
import { sameIdentity } from './songIdentity'

/** 确定性线性同余 PRNG（保证 CI 100% 可复现）。 */
const createRng = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const shuffle = <T>(items: T[], rand: () => number): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const mkInfo = (id: string, name: string, singer: string, source: LX.OnlineSource = 'wy'): LX.Music.MusicInfoOnline => ({
  id,
  name,
  singer,
  source,
  interval: '04:00',
  meta: { songId: id, albumName: 'Album', picUrl: `https://img/${id}.jpg`, qualitys: [], _qualitys: {} },
}) as unknown as LX.Music.MusicInfoOnline

describe('L3 确定性属性测试：三方融合全排列不变性与会话状态机核心不变量', () => {
  it('属性 1：100 组随机三平台批次及同源重复项乱序后，首选录音、RRF 分数与 alternativeMusicInfos 顺序严格不变', () => {
    const rand = createRng(20261124)

    for (let trial = 0; trial < 100; trial++) {
      const songPool = Array.from({ length: 8 }, (_, idx) => ({
        title: `Track_${idx}`,
        artist: `Artist_${idx % 5}`,
        wyId: `wy_${trial}_${idx}`,
        txId: `tx_${trial}_${idx}`,
      }))

      const batches: ProviderBatch[] = PROVIDER_ORDER.map((provider: SimilarProviderId) => {
        const candidates = []
        for (let i = 0; i < songPool.length; i++) {
          if (rand() < 0.4) continue
          const song = songPool[i]
          const rank = Math.floor(rand() * 10) + 1
          if (provider === 'wy') {
            candidates.push({ musicInfo: mkInfo(song.wyId, song.title, song.artist, 'wy'), rank })
            // 随机注入同源重复行检验确定性预排序
            if (rand() < 0.35) {
              candidates.push({ musicInfo: mkInfo(`${song.wyId}_dup`, song.title, song.artist, 'wy'), rank })
            }
          } else if (provider === 'tx') {
            candidates.push({ musicInfo: mkInfo(song.txId, song.title, song.artist, 'tx'), rank })
          } else {
            // ytm 票精确绑定国内已桥接录音 ID
            const bridgedId = rand() < 0.5 ? song.wyId : song.txId
            const bridgedSource: LX.OnlineSource = bridgedId.startsWith('wy_') ? 'wy' : 'tx'
            candidates.push({ musicInfo: mkInfo(bridgedId, song.title, song.artist, bridgedSource), rank })
          }
        }
        return { provider, candidates }
      })

      const signature = (input: ProviderBatch[]) => fuseSimilarCandidates(input).map(item => ({
        id: item.musicInfo.id,
        score: Number(item.fusionScore.toFixed(10)),
        sources: item.sources.map(s => `${s.provider}#${s.rank}:${s.musicInfo.id}`),
        alts: item.alternativeMusicInfos.map(a => a.id),
      }))

      const baseline = signature(batches)
      for (let p = 0; p < 5; p++) {
        const permuted = shuffle(
          batches.map(b => ({ provider: b.provider, candidates: shuffle(b.candidates, rand) })),
          rand,
        )
        expect(signature(permuted)).toEqual(baseline)
      }
    }
  })

  it('属性 2：200 组含超长路径/收台重开/失败计数/繁简换源的随机动作序列下，核心状态机不变量恒成立且必达边界', () => {
    const rand = createRng(998244353)
    const makeAnchor = (idx: number): SessionAnchor => ({
      id: `wy_anchor_${idx}`,
      artist: `AnchorArtist_${idx}`,
      title: `AnchorSong_${idx}`,
      album: 'AnchorAlbum',
      intervalSec: 240,
      musicInfo: mkInfo(`wy_anchor_${idx}`, `AnchorSong_${idx}`, `AnchorArtist_${idx}`, 'wy'),
    })

    const stats = {
      reachedMaxPath: 0,
      reachedFailureCap: 0,
      reachedEndAndReopen: 0,
      testedSimplifiedSwitch: 0,
      testedDislike: 0,
    }

    // 显式长路径裁剪与跨会话零泄漏验证（直接击杀删裁剪或跨会话泄漏变异）
    {
      let longSt = createSession(makeAnchor(9999))
      for (let i = 0; i < MAX_PATH + 15; i++) {
        const id = `wy_long_${i}`
        const info = mkInfo(id, `LongTrack_${i}`, `Artist_${i}`, 'wy')
        longSt = appendToPath(longSt, {
          id,
          artist: info.singer,
          title: info.name,
          album: 'Album',
          reason: 'YouTube Music 相关歌曲推荐',
          journeyRole: 'open',
          state: 'planned',
          musicInfo: info,
        })
      }
      expect(longSt.path).toHaveLength(MAX_PATH)
      expect(longSt.path[0].id).toBe('wy_long_15')
      longSt = applyFeedback(longSt, 'dislike', 'Artist_0', { artist: 'Artist_0', title: 'LongTrack_0' })
      // 收台重开（全新 createSession）不得残留上一会话反馈/路径/失败计数
      const reopened = createSession(makeAnchor(10000))
      expect(reopened.path).toEqual([])
      expect(reopened.dislikedTracks).toEqual([])
      expect(reopened.likedTracks).toEqual([])
      expect(reopened.consecutivePlanFailures ?? 0).toBe(0)
    }

    for (let trial = 0; trial < 200; trial++) {
      let st = createSession(makeAnchor(trial))
      // 每 10 轮构造必经超长序列（>=85 步且偏向追加），稳定覆盖 MAX_PATH=60 裁剪边界
      const isLongTrial = trial % 10 === 0
      const steps = isLongTrial ? 90 : (25 + Math.floor(rand() * 35))
      let seq = 0

      for (let s = 0; s < steps; s++) {
        // 超长序列前 75 步不重置会话，确保必然越过 MAX_PATH=60 触发裁剪；75 步之后允许收台/重锚
        const action = isLongTrial && s < 75
          ? (rand() < 0.88 ? 0 : (1 + Math.floor(rand() * 5)))
          : Math.floor(rand() * 10)
        if (action === 0) {
          // 追加计划条目（携带 recommendSources / picUrl / interval）
          const id = `wy_rec_${trial}_${seq++}`
          const title = seq % 5 === 0 ? `爱在西元前_${seq}` : `RecTitle_${seq}`
          const info = mkInfo(id, title, `RecArtist_${seq % 7}`, 'wy')
          st = addRecommendedIds(st, [id])
          st = appendToPath(st, {
            id,
            artist: info.singer,
            title: info.name,
            album: info.meta.albumName,
            reason: 'YouTube Music 相关歌曲推荐',
            journeyRole: 'open',
            state: 'planned',
            recommendSources: [{ provider: 'ytm', rank: 1 }],
            picUrl: info.meta.picUrl,
            interval: info.interval,
            musicInfo: info,
          })
          if (st.path.length === MAX_PATH) stats.reachedMaxPath++
        } else if (action === 1 && st.path.length > 0) {
          // 路径条目跨源（含繁简）换源播放：必须判 on-path、不重复行、保留徽章与封面
          const target = st.path[Math.floor(rand() * st.path.length)]
          const switchedTitle = target.title.replace('爱', '愛')
          if (switchedTitle !== target.title) stats.testedSimplifiedSwitch++
          const prevLen = st.path.length
          const altId = `tx_alt_${seq++}`
          const altInfo = mkInfo(altId, switchedTitle, target.artist, 'tx')
          const decision = decideOnSongChange(st, {
            radioEnabled: true,
            song: {
              id: altId,
              singer: target.artist,
              name: switchedTitle,
              album: target.album,
              intervalSec: 240,
            },
          })
          expect(decision.kind).toBe('on-path')
          st = appendToPath(st, {
            id: altId,
            artist: target.artist,
            title: switchedTitle,
            album: target.album,
            reason: target.reason,
            journeyRole: target.journeyRole,
            state: 'played',
            musicInfo: altInfo,
          })
          expect(st.path.length).toBeLessThanOrEqual(prevLen)
          const updated = st.path.find(p => p.id === altId)
          if (target.recommendSources) expect(updated?.recommendSources).toEqual(target.recommendSources)
          if (target.picUrl) expect(updated?.picUrl).toBe(target.picUrl)
          if (target.interval) expect(updated?.interval).toBe(target.interval)
        } else if (action === 2) {
          // 锚点同录音跨源确认：恒返回 ignore，绝不误触发重锚
          const decision = decideOnSongChange(st, {
            radioEnabled: true,
            song: {
              id: `tx_anchor_alt_${seq++}`,
              singer: st.anchor.artist,
              name: st.anchor.title,
              album: st.anchor.album,
              intervalSec: st.anchor.intervalSec,
            },
          })
          expect(decision.kind).toBe('ignore')
        } else if (action === 3) {
          // 同标题但仅共享合作者且时长迥异的陌生歌曲：必须 reanchor（不误判为锚点或路径）
          const decision = decideOnSongChange(st, {
            radioEnabled: true,
            song: {
              id: `kg_collab_${seq++}`,
              singer: `OtherMain_${seq}、${st.anchor.artist}`,
              name: st.anchor.title,
              intervalSec: 120,
            },
          })
          expect(decision.kind).toBe('reanchor')
        } else if (action === 4) {
          // 正反馈（good）
          const track = { artist: `Artist_${s % 4}`, title: `Song_${s % 4}` }
          st = applyFeedback(st, 'good', track.artist, track)
        } else if (action === 5) {
          // 负反馈（dislike / dislikePathItem 领域转移）：验证 dislikedTracks 写入且与 likedTracks 严格互斥
          const target = st.path.length > 0 ? st.path[0] : { artist: `Artist_${s % 4}`, title: `Song_${s % 4}` }
          const targetRef = { artist: target.artist, title: target.title }
          st = applyFeedback(st, 'dislike', target.artist, targetRef)
          expect(st.dislikedTracks.some(item => sameIdentity(item, targetRef))).toBe(true)
          expect(st.likedTracks.some(item => sameIdentity(item, targetRef))).toBe(false)
          stats.testedDislike++
        } else if (action === 6) {
          // 计划失败计数递增，达到 PLAN_FAILURE_LIMIT 触发收台并重开全新会话
          st = recordPlanFailure(st)
          if (shouldEndRun(st)) {
            expect(st.consecutivePlanFailures ?? 0).toBeGreaterThanOrEqual(PLAN_FAILURE_LIMIT)
            stats.reachedFailureCap++
            st = createSession(makeAnchor(trial * 1000 + s))
            stats.reachedEndAndReopen++
            expect(st.path).toEqual([])
            expect(st.dislikedTracks).toEqual([])
            expect(st.likedTracks).toEqual([])
            expect(st.consecutivePlanFailures ?? 0).toBe(0)
          }
        } else if (action === 7) {
          // 计划成功清零连续失败计数
          st = recordPlanSuccess(st)
          expect(st.consecutivePlanFailures ?? 0).toBe(0)
        } else if (action === 8) {
          // 显式收台后重开全新会话（零旧反馈/旧路径泄漏）
          st = createSession(makeAnchor(trial * 1000 + s))
          stats.reachedEndAndReopen++
          expect(st.path).toEqual([])
          expect(st.recommendedIds).toEqual([])
          expect(st.dislikedTracks).toEqual([])
          expect(st.likedTracks).toEqual([])
          expect(st.consecutivePlanFailures ?? 0).toBe(0)
        } else {
          // 重锚：清空路径/推荐ID/likedTracks
          st = reanchorSession(st, makeAnchor(trial * 100 + s))
          expect(st.path).toEqual([])
          expect(st.recommendedIds).toEqual([])
          expect(st.likedTracks).toEqual([])
        }

        // 不变量 1：路径永不超过 MAX_PATH
        expect(st.path.length).toBeLessThanOrEqual(MAX_PATH)
        // 不变量 2：likedTracks 与 dislikedTracks 严格互斥
        for (const liked of st.likedTracks) {
          expect(st.dislikedTracks.some(disliked => sameIdentity(liked, disliked))).toBe(false)
        }
      }
    }

    // 覆盖断言：确保所有关键边界状态在属性测试中真实到达
    expect(stats.reachedMaxPath).toBeGreaterThan(0)
    expect(stats.reachedFailureCap).toBeGreaterThan(0)
    expect(stats.reachedEndAndReopen).toBeGreaterThan(0)
    expect(stats.testedSimplifiedSwitch).toBeGreaterThan(0)
    expect(stats.testedDislike).toBeGreaterThan(0)
  })
})
