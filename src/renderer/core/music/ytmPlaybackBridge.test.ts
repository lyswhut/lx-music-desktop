import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import musicSdk from '@renderer/utils/musicSdk'
import { hasExactArtistSetMatch } from '@renderer/core/recommend/seedMatch'
import { matchYtmToInfos } from '@renderer/core/recommend/ytmBridge'
import { setYtmRuntimeContext } from '@renderer/utils/musicSdk/ytm/runtimeContext'
import { sharedYtmRegionCache } from '@renderer/utils/musicSdk/ytm/regionCache'
import { getCachedLyricInfo, getOtherSource, handleGetOnlineMusicUrl, handleGetOnlinePicUrl } from './utils'
import { getLyricInfo, getMusicUrl } from './online'

const mocks = vi.hoisted(() => {
  const qualityList: { value: Record<string, any> } = { value: { wy: ['128k'] } }
  return {
    kwSearch: vi.fn(),
    kgSearch: vi.fn(),
    txSearch: vi.fn(),
    wySearch: vi.fn(),
    mgSearch: vi.fn(),
    ytmSearch: vi.fn(),
    wyGetMusicUrl: vi.fn(),
    wyGetLyric: vi.fn(),
    ytmGetMusicUrl: vi.fn(),
    ytmGetLyric: vi.fn(),
    ytmGetPic: vi.fn(),
    getStoreLyric: vi.fn(),
    saveLyric: vi.fn(async() => {}),
    saveMusicUrl: vi.fn(async() => {}),
    getMusicUrlInfo: vi.fn(async(_info?: any): Promise<any> => null),
    qualityList,
    appSetting: {
      'player.isS2t': false,
      'player.playQuality': '128k' as LX.Quality,
      'common.apiSource': 'primary',
      'common.apiSourceBackups': [] as string[],
      'recommend.ytm.enable': true,
    },
    playMusicInfo: {
      musicInfo: null as LX.Music.MusicInfo | null,
      listId: 'temp',
      isTempPlay: true,
    },
    playerMusicInfo: {
      id: '',
      pic: '' as string | null,
    },
  }
})

vi.mock('@renderer/utils/musicSdk/kw', () => ({ default: { musicSearch: { search: mocks.kwSearch } } }))
vi.mock('@renderer/utils/musicSdk/kg', () => ({ default: { musicSearch: { search: mocks.kgSearch } } }))
vi.mock('@renderer/utils/musicSdk/tx', () => ({ default: { musicSearch: { search: mocks.txSearch } } }))
vi.mock('@renderer/utils/musicSdk/wy', () => ({
  default: {
    musicSearch: { search: mocks.wySearch },
    getMusicUrl: mocks.wyGetMusicUrl,
    getLyric: mocks.wyGetLyric,
    getPic: vi.fn(async() => Promise.reject(new Error('pic api down'))),
  },
}))
vi.mock('@renderer/utils/musicSdk/mg', () => ({ default: { musicSearch: { search: mocks.mgSearch } } }))
vi.mock('@renderer/utils/musicSdk/ytm', () => ({
  default: {
    musicSearch: { search: mocks.ytmSearch },
    getMusicUrl: mocks.ytmGetMusicUrl,
    getLyric: mocks.ytmGetLyric,
    getPic: mocks.ytmGetPic,
  },
}))
vi.mock('@renderer/utils/ipc', () => ({
  getMusicUrl: vi.fn(async() => ''),
  getMusicUrlInfo: mocks.getMusicUrlInfo,
  saveMusicUrl: mocks.saveMusicUrl,
  getPlayerLyric: mocks.getStoreLyric,
  saveLyric: mocks.saveLyric,
}))
vi.mock('@renderer/store', () => ({
  qualityList: mocks.qualityList,
  userApi: { apis: {}, qualityLists: {} },
}))
vi.mock('@renderer/store/setting', () => ({
  appSetting: mocks.appSetting,
}))
vi.mock('@renderer/utils', () => ({
  langS2T: (s: string) => s,
  toNewMusicInfo: (raw: any) => ({
    id: `${raw.source}_${raw.songmid}`,
    name: raw.name,
    singer: raw.singer,
    source: raw.source,
    interval: raw.interval ?? '04:00',
    meta: {
      songId: raw.songmid,
      albumName: raw.albumName ?? '',
      picUrl: raw.img ?? '',
      qualitys: raw.types ?? [],
      _qualitys: raw._types ?? {},
    },
  }),
  toOldMusicInfo: (info: any) => info,
}))
vi.mock('@renderer/utils/musicSdk/api-source', () => ({
  apis: () => ({}),
  supportQuality: {},
}))

const row = (source: LX.OnlineSource, id: string, name: string, singer: string, albumName = '', interval = '04:29') => ({
  source,
  songmid: id,
  name,
  singer,
  albumName,
  interval,
})

beforeEach(() => {
  vi.clearAllMocks()
  sharedYtmRegionCache.clear()
  mocks.qualityList.value = { wy: ['128k'] }
  mocks.appSetting['player.playQuality'] = '128k'
  mocks.appSetting['recommend.ytm.enable'] = false
  setYtmRuntimeContext({
    getAppSetting: () => mocks.appSetting,
    getProxy: () => undefined,
  })
  mocks.kwSearch.mockResolvedValue({ list: [] })
  mocks.kgSearch.mockResolvedValue({ list: [] })
  mocks.txSearch.mockResolvedValue({ list: [] })
  mocks.wySearch.mockResolvedValue({ list: [] })
  mocks.mgSearch.mockResolvedValue({ list: [] })
  mocks.ytmSearch.mockResolvedValue({ list: [] })
  mocks.wyGetMusicUrl.mockImplementation(() => ({ promise: Promise.reject(new Error('wy stream failed')) }))
  mocks.wyGetLyric.mockImplementation(() => ({ promise: Promise.reject(new Error('wy lyric failed')) }))
  mocks.ytmGetMusicUrl.mockImplementation(() => ({ promise: Promise.reject(new Error('ytm direct down')) }))
  mocks.ytmGetLyric.mockImplementation(() => ({ promise: Promise.reject(new Error('ytm lyric down')) }))
  mocks.ytmGetPic.mockRejectedValue(new Error('ytm pic fallback'))
  mocks.getMusicUrlInfo.mockResolvedValue(null)
})

afterEach(() => {
  setYtmRuntimeContext(null)
  vi.unstubAllGlobals()
})

describe('musicSdk.findMusic / searchMusic domestic allow-list & strict YTM matching', () => {
  it('domestic-to-domestic searchMusic never queries ytm and preserves original keyword without simplifying or collapsing Traditional chars', async() => {
    mocks.wySearch.mockResolvedValue({
      list: [
        // 简体“后”与繁体“後”在国内路径不被合并（保持国内匹配语义零回归）
        row('wy', 'w_simp', '后来', '刘若英', '很爱很爱你', '05:41'),
        row('wy', 'w1', '後來', '劉若英', '很愛很愛你', '05:41'),
      ],
    })

    const res = await musicSdk.findMusic({
      name: '後來',
      singer: '劉若英',
      albumName: '很愛很愛你',
      interval: '05:41',
      source: 'kw',
    })

    expect(mocks.ytmSearch).not.toHaveBeenCalled()
    expect(mocks.wySearch).toHaveBeenCalledWith('後來 劉若英', 1, 25)
    expect(res.map((r: any) => r.songmid)).toEqual(['w1'])
  })

  it('YTM cross-source findMusic rejects BOTH A、B and B、A duets for solo query, matches swapped duets and alias brackets', async() => {
    mocks.wySearch.mockResolvedValue({
      list: [
        // A、B 合作版（独唱查合唱）与 B、A 合作版均必须被全集合双向匹配剔除
        row('wy', 'duet_ab', '爱在西元前', '周杰伦、费玉清', '合唱精选', '03:54'),
        row('wy', 'duet_ba', '爱在西元前', '费玉清、周杰伦', '合唱精选', '03:54'),
        // 同录音独唱应命中
        row('wy', 'solo', '爱在西元前', '周杰伦', '范特西', '03:54'),
      ],
    })
    mocks.txSearch.mockResolvedValue({
      list: [
        // 只有 A、B 合作版 → 整源严拒
        row('tx', 'tx_duet_ab', '爱在西元前', '周杰伦、费玉清', '合唱精选', '03:54'),
      ],
    })

    const soloRes = await musicSdk.findMusic({
      name: '愛在西元前',
      singer: 'Jay Chou (周杰倫)',
      albumName: '范特西',
      interval: '03:54',
      source: 'ytm',
    })

    expect(mocks.ytmSearch).not.toHaveBeenCalled()
    expect(mocks.wySearch).toHaveBeenCalledWith('爱在西元前 Jay Chou (周杰伦)', 1, 25)
    expect(soloRes.map((r: any) => r.songmid)).toEqual(['solo'])

    // 合唱曲 A、B 允许匹配顺序对调的 B、A
    mocks.wySearch.mockResolvedValueOnce({
      list: [row('wy', 'duet_swap', '千里之外', '费玉清、周杰伦', '依然范特西', '04:16')],
    })
    const duetRes = await musicSdk.findMusic({
      name: '千里之外',
      singer: '周杰倫、費玉清',
      albumName: '依然范特西',
      interval: '04:16',
      source: 'ytm',
    })
    expect(duetRes.map((r: any) => r.songmid)).toEqual(['duet_swap'])

    // 一对一完整艺人集合校验：拒绝单组别名同时覆盖两组不同艺人，也不因共享括号团名把不同艺人合并或误配
    expect(hasExactArtistSetMatch('A (X)', 'A、B (X)', true)).toBe(false)
    expect(hasExactArtistSetMatch('A (X)', 'A (X)、B (X)', true)).toBe(false)
    expect(hasExactArtistSetMatch('A、B', 'A (X)、B (X)', true)).toBe(true)
    expect(hasExactArtistSetMatch('V (BTS)', 'V (BTS)、Jungkook (BTS)', true)).toBe(false)
    expect(hasExactArtistSetMatch('V、Jungkook', 'V (BTS)、Jungkook (BTS)', true)).toBe(true)
    expect(hasExactArtistSetMatch('V (BTS)', 'Jungkook (BTS)', true)).toBe(false)
    expect(hasExactArtistSetMatch('Jay Chou (周杰倫)', '周杰伦', true)).toBe(true)
    expect(hasExactArtistSetMatch('A (B) C', 'A (B) C', true)).toBe(true)
    expect(matchYtmToInfos(
      { videoId: 'vSpace1', title: 'Track', artist: 'A (B) C', album: '', intervalSec: 200, picUrl: null },
      [{
        id: 'wy_space1',
        name: 'Track',
        singer: 'A C',
        source: 'wy',
        interval: '03:20',
        meta: { songId: 'space1', albumName: '', qualitys: [], _qualitys: {} },
      }],
    )?.id).toBe('wy_space1')

    // 探索桥接 matchYtmToInfos 与播放器 alternativeMusicInfos 均拒绝独唱 A 误匹配合唱 A、B
    const duetDomestic: LX.Music.MusicInfoOnline = {
      id: 'wy_duet1',
      name: '晴天',
      singer: '周杰伦、费玉清',
      source: 'wy',
      interval: '04:29',
      meta: { songId: 'duet1', albumName: '叶惠美', qualitys: [{ type: '128k', size: '' }], _qualitys: { '128k': { size: '' } } },
    }
    expect(matchYtmToInfos(
      { videoId: 'vSolo1', title: '晴天', artist: '周杰伦', album: '叶惠美', intervalSec: 269, picUrl: null },
      [duetDomestic],
    )).toBeNull()

    // 构造可命中的国内合唱缓存 URL（含 musicInfo）：若撤回 utils.ts:366 严格守卫则会 resolve 该缓存 URL，确保两条断言均直接可证伪
    vi.stubGlobal('window', {
      lx: { apiInitPromise: [Promise.resolve(true)] },
      i18n: { t: (key: string) => key },
    })
    mocks.getMusicUrlInfo.mockImplementation(async(info: any) => (
      info?.id === duetDomestic.id
        ? { url: 'https://cached/duet.mp3', type: '128k', musicInfo: duetDomestic }
        : null
    ))
    const onToggleSource = vi.fn()
    const ytmSolo: LX.Music.MusicInfoOnline = {
      id: 'ytm_vSolo1',
      name: '晴天',
      singer: '周杰伦',
      source: 'ytm',
      interval: '04:29',
      meta: { songId: 'vSolo1', albumName: '叶惠美', qualitys: [], _qualitys: {} },
    }
    await expect(handleGetOnlineMusicUrl({
      musicInfo: ytmSolo,
      quality: '128k',
      isRefresh: false,
      allowToggleSource: true,
      alternativeMusicInfos: [duetDomestic],
      onToggleSource,
    })).rejects.toThrow()
    expect(onToggleSource).not.toHaveBeenCalledWith(duetDomestic)

    // YTM 封面一次性回落（isRefresh=true）在国内 getPic API 失败时仍直接复用桥接国内候选自带的 meta.picUrl
    mocks.wySearch.mockResolvedValueOnce({
      list: [{ ...row('wy', 'wPic1', '晴天', '周杰伦', '叶惠美', '04:29'), img: 'https://wy/cover.jpg' }],
    })
    const picRes = await handleGetOnlinePicUrl({
      musicInfo: { ...ytmSolo, id: 'ytm_vPic1' },
      isRefresh: true,
      allowToggleSource: true,
      onToggleSource: vi.fn(),
    })
    expect(picRes.url).toBe('https://wy/cover.jpg')
  })
})

describe('getOtherSource cache hygiene & getCachedLyricInfo for YTM', () => {
  it('never caches empty failure results and bypasses cache when isRefresh=true', async() => {
    const ytmSong: LX.Music.MusicInfoOnline = {
      id: 'ytm_cacheTest1',
      name: '晴天',
      singer: '周杰伦',
      source: 'ytm',
      interval: '04:29',
      meta: { songId: 'cacheTest1', albumName: '叶惠美', qualitys: [{ type: '128k', size: '' }], _qualitys: { '128k': { size: '' } } },
    }

    // 第 1 次全源空结果：不缓存空数组
    const first = await getOtherSource(ytmSong)
    expect(first).toEqual([])
    expect(mocks.wySearch).toHaveBeenCalledTimes(1)

    // 第 2 次应重新搜索并命中
    mocks.wySearch.mockResolvedValueOnce({ list: [row('wy', 'w186016', '晴天', '周杰伦', '叶惠美', '04:29')] })
    const second = await getOtherSource(ytmSong)
    expect(second.map(s => s.id)).toEqual(['wy_w186016'])
    expect(mocks.wySearch).toHaveBeenCalledTimes(2)

    // 第 3 次非刷新命中缓存（0 搜索）
    const third = await getOtherSource(ytmSong)
    expect(third.map(s => s.id)).toEqual(['wy_w186016'])
    expect(mocks.wySearch).toHaveBeenCalledTimes(2)

    // 第 4 次 isRefresh=true 跳过缓存重新搜索
    mocks.wySearch.mockResolvedValueOnce({ list: [row('wy', 'wFresh', '晴天', '周杰伦', '叶惠美', '04:29')] })
    const fourth = await getOtherSource(ytmSong, true)
    expect(fourth.map(s => s.id)).toEqual(['wy_wFresh'])
    expect(mocks.wySearch).toHaveBeenCalledTimes(3)
  })

  it('stale pre-refresh getOtherSource resolving late never overwrites newer refresh cache', async() => {
    const ytmSong: LX.Music.MusicInfoOnline = {
      id: 'ytm_raceOther1',
      name: '七里香',
      singer: '周杰伦',
      source: 'ytm',
      interval: '04:59',
      meta: { songId: 'raceOther1', albumName: '七里香', qualitys: [], _qualitys: {} },
    }
    let resolveStale!: (val: { list: any[] }) => void
    mocks.wySearch
      .mockReturnValueOnce(new Promise(resolve => { resolveStale = resolve }))
      .mockResolvedValueOnce({ list: [row('wy', 'wNewest', '七里香', '周杰伦', '七里香', '04:59')] })

    const staleReq = getOtherSource(ytmSong, false)
    const freshReq = getOtherSource(ytmSong, true)
    const freshRes = await freshReq
    expect(freshRes.map(s => s.id)).toEqual(['wy_wNewest'])

    // 迟到的旧请求在 refresh 之后 resolve，绝不可覆盖新缓存
    resolveStale({ list: [row('wy', 'wStale', '七里香', '周杰伦', '七里香', '04:59')] })
    await staleReq

    const cachedAfter = await getOtherSource(ytmSong, false)
    expect(cachedAfter.map(s => s.id)).toEqual(['wy_wNewest'])
  })

  it('getCachedLyricInfo accepts timestamped lyric for ytm without requiring tlyric', async() => {
    mocks.getStoreLyric.mockResolvedValueOnce({
      lyric: '[00:01.00]故事的小黄花',
      tlyric: '',
      rlyric: '',
      lxlyric: '',
    })
    const ytmSong: LX.Music.MusicInfoOnline = {
      id: 'ytm_lyric1',
      name: '晴天',
      singer: '周杰伦',
      source: 'ytm',
      interval: '04:29',
      meta: { songId: 'lyric1', albumName: '', qualitys: [], _qualitys: {} },
    }
    const cached = await getCachedLyricInfo(ytmSong)
    expect(cached?.lyric).toBe('[00:01.00]故事的小黄花')
  })

  it('online getLyricInfo writes YTM lyric alias even when domestic target was already cached (isFromCache=true)', async() => {
    const ytmSong: LX.Music.MusicInfoOnline = {
      id: 'ytm_lyricAlias1',
      name: '晴天',
      singer: '周杰伦',
      source: 'ytm',
      interval: '04:29',
      meta: { songId: 'lyricAlias1', albumName: '叶惠美', qualitys: [], _qualitys: {} },
    }
    // 首次查 YTM 无歌词缓存，查 wy 目标命中已有缓存 (isFromCache=true)
    mocks.getStoreLyric.mockImplementation(async(info: any) => {
      if (info.id === 'wy_wLyric1') {
        return { lyric: '[00:01.00]从前从前有个人爱你很久', tlyric: '', rlyric: '', lxlyric: '' }
      }
      return { lyric: '', tlyric: '', rlyric: '', lxlyric: '' }
    })
    mocks.wySearch.mockResolvedValueOnce({ list: [row('wy', 'wLyric1', '晴天', '周杰伦', '叶惠美', '04:29')] })

    const res = await getLyricInfo({ musicInfo: ytmSong, isRefresh: false })
    expect(res.lyric).toBe('[00:01.00]从前从前有个人爱你很久')
    expect(mocks.saveLyric).toHaveBeenCalledWith(ytmSong, expect.objectContaining({ lyric: '[00:01.00]从前从前有个人爱你很久' }))
  })

  it('first-class YTM direct playback works without domestic userApi, rescues domestic failures when enabled, and bypasses expired googlevideo cache', async() => {
    vi.stubGlobal('window', {
      lx: { apiInitPromise: [Promise.resolve(false)] },
      i18n: { t: (key: string) => key },
    })
    mocks.qualityList.value = {}
    mocks.appSetting['player.playQuality'] = '320k'
    const ytmDirect: LX.Music.MusicInfoOnline = {
      id: 'ytm_direct01',
      name: 'Only On YouTube',
      singer: 'Indie Artist',
      source: 'ytm',
      interval: '03:21',
      meta: {
        songId: 'direct01',
        albumName: '',
        qualitys: [{ type: '128k', size: '' }, { type: '320k', size: '' }],
        _qualitys: { '128k': { size: '' }, '320k': { size: '' } },
      },
    }
    const freshUrl = 'https://rr1---sn-test.googlevideo.com/videoplayback?itag=251&expire=2999999999'
    const expiredUrl = 'https://rr1---sn-test.googlevideo.com/videoplayback?itag=251&expire=1000000000'
    mocks.getMusicUrlInfo.mockResolvedValueOnce({ url: expiredUrl, type: '320k', musicInfo: ytmDirect })
    mocks.ytmGetMusicUrl.mockReturnValueOnce({ promise: Promise.resolve({ url: freshUrl, type: '320k' }) })

    const resolvedUrl = await getMusicUrl({ musicInfo: ytmDirect, isRefresh: false })
    expect(resolvedUrl).toBe(freshUrl)
    expect(mocks.ytmGetMusicUrl).toHaveBeenCalledWith(ytmDirect, '320k', undefined)
    expect(mocks.wySearch).not.toHaveBeenCalled()
    expect(mocks.saveMusicUrl).toHaveBeenCalledWith(ytmDirect, '320k', freshUrl, ytmDirect)

    // 双向平权：国内曲目在所有国内源失败时，若 recommend.ytm.enable=true 可通过 YTM 原生直链救回
    mocks.appSetting['recommend.ytm.enable'] = true
    mocks.ytmSearch.mockResolvedValueOnce({
      list: [{
        ...row('ytm', 'ytmRescue01', '晴天', '周杰伦', '叶惠美', '04:29'),
        types: [{ type: '128k', size: '' }, { type: '320k', size: '' }],
        _types: { '128k': { size: '' }, '320k': { size: '' } },
      }],
    })
    const rescueUrl = 'https://rr2---sn-test.googlevideo.com/videoplayback?itag=140&expire=2999999999'
    mocks.ytmGetMusicUrl.mockReturnValueOnce({ promise: Promise.resolve({ url: rescueUrl, type: '128k' }) })
    const domesticSong: LX.Music.MusicInfoOnline = {
      id: 'wy_rescue01',
      name: '晴天',
      singer: '周杰伦',
      source: 'wy',
      interval: '04:29',
      meta: { songId: 'rescue01', albumName: '叶惠美', qualitys: [{ type: '128k', size: '' }], _qualitys: { '128k': { size: '' } } },
    }
    mocks.appSetting['player.playQuality'] = '128k'
    const onResolved = vi.fn()
    const rescued = await getMusicUrl({
      musicInfo: domesticSong,
      isRefresh: false,
      allowToggleSource: true,
      onResolvedMusicInfo: onResolved,
    })
    expect(rescued).toBe(rescueUrl)
    expect(onResolved).toHaveBeenCalledWith(expect.objectContaining({ id: 'ytm_ytmRescue01', source: 'ytm' }))
    expect(mocks.saveMusicUrl).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ytm_ytmRescue01' }),
      '128k',
      rescueUrl,
      expect.objectContaining({ id: 'ytm_ytmRescue01' }),
    )
  })

  it('first-class YTM lyrics: uses timed YTM LRC directly, falls back to untimed YTM lyric when domestic fails, and tolerates saveLyric errors', async() => {
    const ytmSong: LX.Music.MusicInfoOnline = {
      id: 'ytm_lrcDirect1',
      name: 'Exclusive Track',
      singer: 'Solo Artist',
      source: 'ytm',
      interval: '03:00',
      meta: { songId: 'lrcDirect1', albumName: '', qualitys: [], _qualitys: {} },
    }
    mocks.getStoreLyric.mockResolvedValue({ lyric: '', tlyric: '', rlyric: '', lxlyric: '' })
    mocks.ytmGetLyric.mockReturnValueOnce({
      promise: Promise.resolve({ lyric: '[00:05.00]Native YTM Timed Lyric', tlyric: '', rlyric: '', lxlyric: '' }),
    })
    mocks.saveLyric.mockRejectedValueOnce(new Error('sqlite busy'))

    const timed = await getLyricInfo({ musicInfo: ytmSong, isRefresh: false })
    expect(timed.lyric).toBe('[00:05.00]Native YTM Timed Lyric')
    expect(mocks.wySearch).not.toHaveBeenCalled()

    // 仅提供纯文本 untimedLyric 时先尝试国内同步歌词，国内无匹配时平滑兜底展示 YTM 纯文本歌词，且绝不持久化污染 SQLite 歌词缓存
    mocks.saveLyric.mockClear()
    mocks.ytmGetLyric.mockReturnValueOnce({
      promise: Promise.resolve({ lyric: '', untimedLyric: '[00:00.00]YouTube Plain Lyric Line', tlyric: '', rlyric: '', lxlyric: '' }),
    })
    const untimed = await getLyricInfo({ musicInfo: { ...ytmSong, id: 'ytm_lrcPlain1' }, isRefresh: true })
    expect(untimed.lyric).toBe('[00:00.00]YouTube Plain Lyric Line')
    expect(mocks.saveLyric).not.toHaveBeenCalled()

    // allowToggleSource=false（如默认下载嵌入歌词）遇到 untimedLyric 时同样不落盘持久缓存
    mocks.ytmGetLyric.mockReturnValueOnce({
      promise: Promise.resolve({ lyric: '', untimedLyric: '[00:00.00]Download Untimed', tlyric: '', rlyric: '', lxlyric: '' }),
    })
    const untimedDl = await getLyricInfo({ musicInfo: { ...ytmSong, id: 'ytm_lrcPlainDl' }, isRefresh: true, allowToggleSource: false })
    expect(untimedDl.lyric).toBe('[00:00.00]Download Untimed')
    expect(mocks.saveLyric).not.toHaveBeenCalled()

    // 播放栏封面 <img> 加载失败时 skipPrimary=true 跳过再次返回坏链的 ytm.getPic，直达国内封面回落
    mocks.ytmGetPic.mockResolvedValueOnce('https://broken-google-thumb.example/fail.jpg')
    mocks.wySearch.mockResolvedValueOnce({
      list: [{ ...row('wy', 'wPicSkip1', 'Exclusive Track', 'Solo Artist', '', '03:00'), img: 'https://wy/fallback-cover.jpg' }],
    })
    const picFallback = await handleGetOnlinePicUrl({
      musicInfo: { ...ytmSong, id: 'ytm_picSkip1' },
      isRefresh: true,
      allowToggleSource: true,
      skipPrimary: true,
      onToggleSource: vi.fn(),
    })
    expect(mocks.ytmGetPic).not.toHaveBeenCalled()
    expect(picFallback.url).toBe('https://wy/fallback-cover.jpg')

    // otherSourceCache 感知 recommend.ytm.enable 开关变更，关闭 YTM 后不再向国内曲目泄露旧 YTM 换源缓存
    const domTrack: LX.Music.MusicInfoOnline = {
      id: 'wy_toggleCache1',
      name: '晴天',
      singer: '周杰伦',
      source: 'wy',
      interval: '04:29',
      meta: { songId: 'toggleCache1', albumName: '叶惠美', qualitys: [], _qualitys: {} },
    }
    mocks.appSetting['recommend.ytm.enable'] = true
    mocks.ytmSearch.mockResolvedValueOnce({
      list: [row('ytm', 'ytmCached1', '晴天', '周杰伦', '叶惠美', '04:29')],
    })
    const withYtm = await getOtherSource(domTrack)
    expect(withYtm.map(i => i.source)).toEqual(['ytm'])

    mocks.appSetting['recommend.ytm.enable'] = false
    const withoutYtm = await getOtherSource(domTrack)
    expect(withoutYtm).toEqual([])
  })
})
