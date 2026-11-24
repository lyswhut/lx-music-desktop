import { describe, expect, it } from 'vitest'
import { applyArtistDiversity, applyProfileAdjustment, fuseSimilarCandidates, PROVIDER_ORDER } from './similarFusion'
import type { ProviderBatch } from './similarFusion'

const info = (id: string, name: string, singer: string) => ({
  id, name, singer, source: id.split('_')[0], interval: '04:00', meta: { albumName: '' },
} as unknown as LX.Music.MusicInfo)

const batch = (provider: 'wy' | 'tx', entries: Array<[string, string, string]>): ProviderBatch => ({
  provider,
  candidates: entries.map(([id, name, singer], i) => ({ musicInfo: info(id, name, singer), rank: i + 1 })),
})

describe('跨源相似候选融合', () => {
  it('a retained-source alias bridge merges earlier groups deterministically without double provider votes', () => {
    const wy = batch('wy', [['wy_a', 'Song', '冯沁苑'], ['wy_b', 'Song', '买辣椒也用券']])
    const tx = batch('tx', [['tx_bridge', 'Song', '冯沁苑（买辣椒也用券）']])
    const expectedScore = fuseSimilarCandidates([batch('wy', [['wy_a', 'Song', '冯沁苑']]), tx])[0].fusionScore
    for (const input of [[wy, tx], [tx, wy]]) {
      const fused = fuseSimilarCandidates(input)
      expect(fused).toHaveLength(1)
      expect(fused[0].musicInfo.id).toBe('wy_a')
      expect(fused[0].sources.map(source => [source.provider, source.rank])).toEqual([['wy', 1], ['tx', 1]])
      expect(fused[0].fusionScore).toBe(expectedScore)
    }
  })

  it('合并括号写法与艺人别名变体的来源证据，录音室版仍独立', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [['wy_live', '起风了（Live）', '冯沁苑（买辣椒也用券）']]),
      batch('tx', [['tx_live', '起风了 (Live)', '买辣椒也用券'], ['tx_studio', '起风了', '买辣椒也用券']]),
    ])
    expect(fused).toHaveLength(2)
    expect(fused[0].sources.map(source => source.musicInfo.id)).toEqual(['wy_live', 'tx_live'])
    expect(fused[1].musicInfo.id).toBe('tx_studio')
  })

  it('保留各来源排名与备用音源条目，不提前丢证据', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [['wy_1', 'Song A', 'Artist X'], ['wy_2', 'Song B', 'Artist Y']]),
      batch('tx', [['tx_9', 'Song A', 'Artist X'], ['tx_8', 'Song C', 'Artist Z']]),
    ])
    const songA = fused.find(f => f.title === 'Song A')!
    expect(songA.sources).toHaveLength(2)
    expect(songA.sources.map(s => s.provider)).toEqual(['wy', 'tx'])
    expect(songA.sources.map(s => s.rank)).toEqual([1, 1])
    // 备用音源条目保留（wy 条目 + tx 条目都在）
    expect(songA.sources.map(s => s.musicInfo.id)).toEqual(['wy_1', 'tx_9'])
  })

  it('多源共同推荐累加融合分，排在单源高排名之前', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [['wy_1', 'Both', 'A'], ['wy_2', 'OnlyWy', 'B']]),
      batch('tx', [['tx_1', 'Both', 'A']]),
    ])
    expect(fused[0].title).toBe('Both')
    // Both = 1/(k+1) + 1/(k+1) > OnlyWy = 1/(k+1)
    expect(fused[0].fusionScore).toBeGreaterThan(fused[1].fusionScore)
  })

  it('同源重复行/重试返回只计一次投票', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [['wy_1', 'Song A', 'A'], ['wy_1b', 'Song A', 'A'], ['wy_2', 'Song B', 'B']]),
    ])
    const songA = fused.find(f => f.title === 'Song A')!
    expect(songA.sources).toHaveLength(1)
    expect(songA.sources[0].rank).toBe(1)
    expect(fused).toHaveLength(2)
  })

  it('确定性：输入批次顺序/异步完成顺序变化不改变结果', () => {
    const b1 = batch('wy', [['wy_1', 'Song A', 'A'], ['wy_2', 'Song B', 'B']])
    const b2 = batch('tx', [['tx_2', 'Song C', 'C'], ['tx_1', 'Song A', 'A']])
    const order1 = fuseSimilarCandidates([b1, b2]).map(f => `${f.title}:${f.sources.map(s => `${s.provider}#${s.rank}`).join(',')}`)
    const order2 = fuseSimilarCandidates([b2, b1]).map(f => `${f.title}:${f.sources.map(s => `${s.provider}#${s.rank}`).join(',')}`)
    expect(order1).toEqual(order2)
  })

  it('完全平手时按固定来源序与标题字典序稳定排序', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [['wy_1', 'Same Rank', 'A']]),
      batch('tx', [['tx_1', 'Same Rank', 'A']]),
    ])
    // 同曲同排名：wy 来源序在前，首选播放条目取 wy
    expect(fused[0].musicInfo.id).toBe('wy_1')
    expect(PROVIDER_ORDER).toEqual(['wy', 'tx', 'ytm'])
  })

  it('YTM 候选仅按已验证精确国内 ID 归组，不经宽松合作者交集跨录音误投 RRF 票', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [['wy_a', 'Shared Title', '主唱A、合作者C']]),
      {
        provider: 'ytm',
        candidates: [
          { musicInfo: info('tx_b', 'Shared Title', '主唱B、合作者C'), rank: 1 },
          { musicInfo: info('wy_a', 'Shared Title', '主唱A、合作者C'), rank: 2 },
        ],
      },
    ])
    expect(fused).toHaveLength(2)
    const mergedWy = fused.find(f => f.musicInfo.id === 'wy_a')!
    expect(mergedWy.sources.map(s => s.provider)).toEqual(['wy', 'ytm'])
    const separateTx = fused.find(f => f.musicInfo.id === 'tx_b')!
    expect(separateTx.sources.map(s => s.provider)).toEqual(['ytm'])
  })

  it('R2 回归：wy 与桥接到 kw 的严格同录音正常跨源融合，且国内宽松合作者混组时仅剥离严格同录音与 YTM 合并', () => {
    const infoWithInterval = (id: string, name: string, singer: string, interval: string) => ({
      id, name, singer, source: id.split('_')[0], interval, meta: { albumName: '' },
    } as unknown as LX.Music.MusicInfo)

    // 1) wy_1 与 ytm(kw_9) 严格同录音（含繁简）合并为一条双源候选，保留 wy 首选与 kw 备用
    const mergedCross = fuseSimilarCandidates([
      { provider: 'wy', candidates: [{ musicInfo: infoWithInterval('wy_1', '晴天', '周杰伦', '04:29'), rank: 1 }] },
      { provider: 'ytm', candidates: [{ musicInfo: infoWithInterval('kw_9', '晴天', '周杰倫', '04:29'), rank: 1 }] },
    ])
    expect(mergedCross).toHaveLength(1)
    expect(mergedCross[0].musicInfo.id).toBe('wy_1')
    expect(mergedCross[0].sources.map(s => s.provider)).toEqual(['wy', 'ytm'])
    expect(mergedCross[0].alternativeMusicInfos.map(m => m.id)).toEqual(['kw_9'])

    // 2) wy(主唱A、合作者C, 03:00) + tx(主唱B、合作者C, 03:50) + ytm(tx)：
    //    wy 不得被传递合并并错得 YTM 分数与徽章；tx 与 ytm 正常合并
    const splitMixed = fuseSimilarCandidates([
      { provider: 'wy', candidates: [{ musicInfo: infoWithInterval('wy_a', 'Shared Title', '主唱A、合作者C', '03:00'), rank: 1 }] },
      { provider: 'tx', candidates: [{ musicInfo: infoWithInterval('tx_b', 'Shared Title', '主唱B、合作者C', '03:50'), rank: 1 }] },
      { provider: 'ytm', candidates: [{ musicInfo: infoWithInterval('tx_b', 'Shared Title', '主唱B、合作者C', '03:50'), rank: 1 }] },
    ])
    expect(splitMixed).toHaveLength(2)
    const txYtm = splitMixed.find(f => f.musicInfo.id === 'tx_b')!
    const wyOnly = splitMixed.find(f => f.musicInfo.id === 'wy_a')!
    expect(txYtm.sources.map(s => s.provider)).toEqual(['tx', 'ytm'])
    expect(wyOnly.sources.map(s => s.provider)).toEqual(['wy'])
    expect(wyOnly.alternativeMusicInfos).toEqual([])

    // 3) R3 回归：180s (wy) ↔ 194s (tx) ↔ 208s (ytm/kw) 端点时长差 28s > 15s，阻断链式传递让 wy 误享 YTM 票
    const noChainDrift = fuseSimilarCandidates([
      { provider: 'wy', candidates: [{ musicInfo: infoWithInterval('wy_180', 'DriftSong', 'Artist', '03:00'), rank: 1 }] },
      { provider: 'tx', candidates: [{ musicInfo: infoWithInterval('tx_194', 'DriftSong', 'Artist', '03:14'), rank: 1 }] },
      { provider: 'ytm', candidates: [{ musicInfo: infoWithInterval('kw_208', 'DriftSong', 'Artist', '03:28'), rank: 1 }] },
    ])
    expect(noChainDrift).toHaveLength(2)
    expect(noChainDrift.find(f => f.musicInfo.id === 'wy_180')?.sources.map(s => s.provider)).toEqual(['wy'])
    expect(noChainDrift.find(f => f.musicInfo.id === 'tx_194')?.sources.map(s => s.provider)).toEqual(['tx', 'ytm'])
  })

  it('单源高排名候选仍保留展示机会（不被多源垄断）', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [['wy_1', 'Multi', 'A'], ['wy_5', 'SoloHigh', 'B']]),
      batch('tx', [['tx_3', 'Multi', 'A'], ['tx_1', 'SoloTx', 'C']]),
    ])
    // SoloHigh 单源 rank5：1/(k+5)；Multi 两源：1/(k+1)+1/(k+3) —— Multi 更高，但 SoloHigh 仍在列表中
    expect(fused.map(f => f.title)).toContain('SoloHigh')
    expect(fused[0].title).toBe('Multi')
  })
})

describe('画像有界调整与艺人多样性', () => {
  it.each([
    ['冯沁苑（买辣椒也用券）', '买辣椒也用券'],
    ['买辣椒也用券', '冯沁苑 ( 买辣椒也用券 )'],
    ['冯沁苑（买辣椒也用券）', '冯沁苑'],
    [' Adele ', 'A\u200Bdele'],
  ])('distinct titles share the primary-artist cap across aliases: %s / %s', (wyArtist, txArtist) => {
    const wy = batch('wy', [['wy_1', 'S1', wyArtist], ['wy_2', 'S2', wyArtist]])
    const tx = batch('tx', [['tx_1', 'S3', txArtist], ['tx_2', 'S4', txArtist]])
    for (const batches of [[wy, tx], [tx, wy]]) {
      const fused = fuseSimilarCandidates(batches)
      expect(fused).toHaveLength(4)
      expect(applyArtistDiversity(fused).map(item => item.title)).toEqual(['S1', 'S3'])
    }
  })

  it('aliases retained only in alternative source evidence still link the displayed primary quotas', () => {
    const wy = batch('wy', [['wy_1', 'S1', '冯沁苑'], ['wy_2', 'S2', '冯沁苑']])
    const tx = batch('tx', [
      ['tx_1', 'S1', '冯沁苑（买辣椒也用券）'],
      ['tx_3', 'S3', '买辣椒也用券'],
      ['tx_4', 'S4', '买辣椒也用券'],
    ])
    for (const batches of [[wy, tx], [tx, wy]]) {
      const fused = fuseSimilarCandidates(batches)
      expect(fused.map(item => item.title)).toEqual(['S1', 'S2', 'S3', 'S4'])
      expect(fused[0].artist).toBe('冯沁苑')
      expect(fused[0].sources.map(source => source.musicInfo.singer)).toEqual(['冯沁苑', '冯沁苑（买辣椒也用券）'])
      expect(applyArtistDiversity(fused).map(item => item.title)).toEqual(['S1', 'S2'])
    }
  })

  it('co-fused sources with different primaries do not merge their quotas through a shared collaborator', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [
        ['wy_1', 'Shared Song', 'A、Shared'],
        ['wy_2', 'A2', 'A'],
        ['wy_3', 'A3', 'A'],
      ]),
      batch('tx', [
        ['tx_1', 'Shared Song', 'B、Shared'],
        ['tx_2', 'B2', 'B'],
        ['tx_3', 'B3', 'B'],
      ]),
    ])
    expect(fused[0].sources.map(source => source.musicInfo.singer)).toEqual(['A、Shared', 'B、Shared'])
    expect(applyArtistDiversity(fused).map(item => item.title)).toEqual(['Shared Song', 'A2', 'B2', 'B3'])
  })

  it('a later bracketed alias connects primary names before counting the ranked batch', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [
        ['wy_1', 'S1', '冯沁苑'],
        ['wy_2', 'S2', '冯沁苑'],
        ['wy_3', 'S5', '冯沁苑（买辣椒也用券）'],
      ]),
      batch('tx', [['tx_1', 'S3', '买辣椒也用券'], ['tx_2', 'S4', '买辣椒也用券']]),
    ])
    expect(fused).toHaveLength(5)
    expect(applyArtistDiversity(fused).map(item => item.title)).toEqual(['S1', 'S3'])
  })

  it('different primary artists keep separate quotas despite a shared collaborator or alias', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [
        ['wy_1', 'S1', 'A、Shared (Alias)'],
        ['wy_2', 'S2', 'A'],
        ['wy_3', 'S3', 'A、Other'],
      ]),
      batch('tx', [
        ['tx_1', 'S4', 'B、Alias'],
        ['tx_2', 'S5', 'B、Shared'],
        ['tx_3', 'S6', 'B'],
      ]),
    ])
    expect(applyArtistDiversity(fused).map(item => item.title)).toEqual(['S1', 'S4', 'S2', 'S5'])
  })

  it('画像加成有界（±15%），来源排名仍主导', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [['wy_1', 'Top', 'Favorite'], ['wy_2', 'Second', 'Other']]),
    ])
    // Favorite +10 → +15%；Other -10 → -15%：分数差距被压缩但不翻转量级主导
    const adjusted = applyProfileAdjustment(fused, artist => (artist === 'Favorite' ? 10 : -10))
    expect(adjusted[0].title).toBe('Top')
    expect(adjusted[0].fusionScore).toBeCloseTo(fused[0].fusionScore * 1.15, 8)
    expect(adjusted[1].fusionScore).toBeCloseTo(fused[1].fusionScore * 0.85, 8)
  })

  it('画像加成可小幅重排相邻候选，但不会无界放大', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [['wy_1', 'A', 'X'], ['wy_2', 'B', 'Y']]),
    ])
    // 相邻排名分数接近时，+15% 与 -15% 可以翻转
    const adjusted = applyProfileAdjustment(fused, artist => (artist === 'Y' ? 10 : -10))
    expect(adjusted[0].title).toBe('B')
  })

  it('艺人多样性：同主艺人每批最多 2 首，超出不展示且不补足数量', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [
        ['wy_1', 'S1', 'Same Artist'],
        ['wy_2', 'S2', 'Same Artist'],
        ['wy_3', 'S3', 'Same Artist'],
        ['wy_4', 'Other', 'Different Artist'],
      ]),
    ])
    const diversified = applyArtistDiversity(fused, 2)
    expect(diversified.map(f => f.title)).toEqual(['S1', 'S2', 'Other'])
  })

  it('艺人主 token 归一（合作艺人按首个 token 计数）', () => {
    const fused = fuseSimilarCandidates([
      batch('wy', [
        ['wy_1', 'S1', 'A、B'],
        ['wy_2', 'S2', 'A'],
        ['wy_3', 'S3', 'A、C'],
        ['wy_4', 'S4', 'D'],
      ]),
    ])
    const diversified = applyArtistDiversity(fused, 2)
    expect(diversified.map(f => f.title)).toEqual(['S1', 'S2', 'S4'])
  })
})
