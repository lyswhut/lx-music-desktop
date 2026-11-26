import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { YTM_AGGREGATE_SEARCH_TIMEOUT_MS } from '@common/recommendationConfig'
import { setYtmRuntimeContext } from '@renderer/utils/musicSdk/ytm/runtimeContext'
import { sharedYtmRegionCache } from '@renderer/utils/musicSdk/ytm/regionCache'
import { cancelSearch as cancelMusicSearch, search as searchMusic } from './music/action'
import { listInfos as musicListInfos } from './music/state'
import { cancelSearch as cancelSonglistSearch, search as searchSonglist } from './songlist/action'
import { listInfos as songlistListInfos } from './songlist/state'
import { createCatalogSearchStore } from './catalog/index'
import { canDirectDownload } from '@renderer/core/music/sourceCapabilities'
import { createDownloadTasks } from '@renderer/store/download/action'
import { createDownloadInfo } from '@renderer/worker/download/utils'

const mocks = vi.hoisted(() => {
  const qualityList: { value: Record<string, any> } = { value: { wy: ['128k', '320k'] } }
  return {
    txMusicSearch: vi.fn(),
    ytmMusicSearch: vi.fn(),
    txSonglistSearch: vi.fn(),
    ytmSonglistSearch: vi.fn(),
    qualityList,
    downloadList: [] as any[],
    downloadAdd: vi.fn(async(_tasks?: any[]) => {}),
    workerCreateDownloadTasks: vi.fn(async(list: LX.Music.MusicInfoOnline[], _quality?: any, _fileName?: any, _qualityList?: any) => list.map(musicInfo => ({
      id: `dl_${musicInfo.id}`,
      metadata: { musicInfo },
    }))),
    appSetting: {
      'common.apiSource': 'primary',
      'common.apiSourceBackups': [] as string[],
      'download.savePath': '/tmp/downloads',
      'download.fileName': '歌名 - 歌手',
      'download.maxDownloadNum': 3,
      'download.isEmbedPic': false,
      'download.isEmbedLyric': false,
      'download.isEmbedLyricT': false,
      'download.isEmbedLyricR': false,
      'download.isEmbedLyricLx': false,
      'download.isDownloadLrc': false,
      'download.isDownloadTLrc': false,
      'download.isDownloadRLrc': false,
      'download.isDownloadLxLrc': false,
      'download.lrcFormat': 'utf8',
      'download.isUseOtherSource': false,
    },
  }
})

vi.mock('@renderer/utils/musicSdk', () => ({
  default: {
    sources: [{ id: 'tx' }, { id: 'ytm' }],
    tx: {
      musicSearch: { search: mocks.txMusicSearch },
      songList: { search: mocks.txSonglistSearch },
    },
    ytm: {
      musicSearch: { search: mocks.ytmMusicSearch },
      songList: { search: mocks.ytmSonglistSearch },
    },
  },
}))
vi.mock('@renderer/utils', () => ({
  arrPush: <T>(arr: T[], items: T[]) => { arr.push(...items) },
  arrUnshift: <T>(arr: T[], items: T[]) => { arr.unshift(...items) },
  deduplicationList: <T extends { id: string }>(list: T[]) => list,
  toNewMusicInfo: (song: any) => ({
    id: song.id ?? `${song.source}_${song.songmid}`,
    name: song.name,
    singer: song.singer,
    source: song.source,
    interval: song.interval ?? '03:00',
    meta: { songId: song.songmid ?? song.id, albumName: song.albumName ?? '', qualitys: [], _qualitys: {} },
  }),
}))
vi.mock('@renderer/store', () => ({
  qualityList: mocks.qualityList,
  userApi: { apis: {}, qualityLists: {} },
}))
vi.mock('@renderer/store/setting', () => ({
  appSetting: mocks.appSetting,
}))
vi.mock('@renderer/store/download/state', () => ({
  downloadList: mocks.downloadList,
}))
vi.mock('@renderer/utils/ipc', () => ({
  downloadListAdd: mocks.downloadAdd,
  downloadTasksCreate: mocks.downloadAdd,
  downloadListRemove: vi.fn(async() => {}),
  downloadListUpdate: vi.fn(async() => {}),
  downloadListUpdatePosition: vi.fn(async() => {}),
  getDownloadList: vi.fn(async() => []),
  downloadListClear: vi.fn(async() => {}),
  getUserApiList: vi.fn(async() => []),
}))
vi.mock('@renderer/utils/fs', () => ({
  checkPath: vi.fn(async() => true),
}))
vi.mock('@common/utils/common', async(importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal()
  return { ...actual }
})

const deferred = <T>() => {
  let resolve!: (val: T) => void
  let reject!: (err: Error) => void
  const cancel = vi.fn()
  const promise = Object.assign(new Promise<T>((_resolve, _reject) => { resolve = _resolve; reject = _reject }), { cancel })
  return { promise, resolve, reject, cancel }
}

const flushMicrotasks = async() => {
  for (let i = 0; i < 6; i++) await Promise.resolve()
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.downloadList.length = 0
  sharedYtmRegionCache.clear()
  setYtmRuntimeContext({
    getAppSetting: () => ({ 'recommend.ytm.enable': true }),
    getProxy: () => undefined,
  })
  vi.stubGlobal('window', {
    i18n: { t: (key: string) => key },
    app_event: {
      downloadListUpdate: vi.fn(),
    },
    lx: {
      appSetting: mocks.appSetting,
      worker: {
        download: {
          createDownloadTasks: mocks.workerCreateDownloadTasks,
        },
      },
    },
  })
})

afterEach(() => {
  vi.useRealTimers()
  setYtmRuntimeContext(null)
  vi.unstubAllGlobals()
})

describe('progressive aggregate search with YTM soft timeout, toggle, and cancel', () => {
  it('all music search publishes domestic results immediately, merges late YTM results, and cancels YTM after 4s timeout', async() => {
    vi.useFakeTimers()

    // 场景 1：YTM 在超时前到达 → 国内先出，YTM 到达后增量合并
    const ytmFast = deferred<any>()
    mocks.txMusicSearch.mockResolvedValueOnce({
      source: 'tx',
      list: [{ id: 'tx_1', songmid: '1', name: '晴天', singer: '周杰伦', source: 'tx' }],
      total: 1,
      limit: 30,
      allPage: 1,
    })
    mocks.ytmMusicSearch.mockReturnValueOnce(ytmFast.promise)

    const p1 = searchMusic('晴天', 1, 'all')
    await flushMicrotasks()
    // 国内结果在 YTM 仍 pending 时已立即上屏
    expect(musicListInfos.all.list.map(s => s.id)).toEqual(['tx_1'])

    ytmFast.resolve({
      source: 'ytm',
      list: [{ id: 'ytm_v1', songmid: 'v1', name: '晴天', singer: '周杰伦', source: 'ytm' }],
      total: 20,
      limit: 20,
      allPage: 1,
    })
    const merged = await p1
    expect(merged.map(s => s.id)).toEqual(expect.arrayContaining(['tx_1', 'ytm_v1']))

    // 场景 2：YTM 超过 4s 软超时 → 取消 YTM 请求并保留国内结果
    const ytmHung = deferred<any>()
    mocks.txMusicSearch.mockResolvedValueOnce({
      source: 'tx',
      list: [{ id: 'tx_2', songmid: '2', name: '稻香', singer: '周杰伦', source: 'tx' }],
      total: 1,
      limit: 30,
      allPage: 1,
    })
    mocks.ytmMusicSearch.mockReturnValueOnce(ytmHung.promise)

    const p2 = searchMusic('稻香', 1, 'all')
    await flushMicrotasks()
    expect(musicListInfos.all.list.map(s => s.id)).toEqual(['tx_2'])

    await vi.advanceTimersByTimeAsync(YTM_AGGREGATE_SEARCH_TIMEOUT_MS + 50)
    const afterTimeout = await p2
    expect(ytmHung.cancel).toHaveBeenCalledOnce()
    expect(afterTimeout.map(s => s.id)).toEqual(['tx_2'])
    expect(musicListInfos.all.noItemLabel).toBe('')
  })

  it('all music, songlist & catalog search respect recommend.ytm.enable=false while explicit source=ytm still queries YTM', async() => {
    setYtmRuntimeContext({
      getAppSetting: () => ({ 'recommend.ytm.enable': false }),
      getProxy: () => undefined,
    })
    mocks.txMusicSearch.mockResolvedValueOnce({
      source: 'tx',
      list: [{ id: 'tx_m1', songmid: 'm1', name: '晴天', singer: '周杰伦', source: 'tx' }],
      total: 1,
      limit: 30,
      allPage: 1,
    })
    await searchMusic('晴天', 1, 'all')
    expect(mocks.ytmMusicSearch).not.toHaveBeenCalled()
    expect(musicListInfos.all.list.map(i => i.id)).toEqual(['tx_m1'])

    mocks.ytmMusicSearch.mockResolvedValueOnce({
      source: 'ytm',
      list: [{ id: 'ytm_vOnly1', songmid: 'vOnly1', name: '晴天', singer: '周杰伦', source: 'ytm' }],
      total: 1,
      limit: 20,
      allPage: 1,
    })
    await searchMusic('晴天', 1, 'ytm')
    expect(mocks.ytmMusicSearch).toHaveBeenCalledOnce()
    expect(musicListInfos.ytm?.list.map(i => i.id)).toEqual(['ytm_vOnly1'])

    mocks.txSonglistSearch.mockResolvedValueOnce({
      source: 'tx',
      list: [{ id: 'tx_pl1', name: '华语', author: 'QQ', desc: '', img: '', play_count: '1', source: 'tx' }],
      total: 1,
      limit: 18,
    })
    await searchSonglist('华语', 1, 'all')
    expect(mocks.ytmSonglistSearch).not.toHaveBeenCalled()
    expect(songlistListInfos.all.list.map(i => i.id)).toEqual(['tx_pl1'])

    mocks.ytmSonglistSearch.mockResolvedValueOnce({
      source: 'ytm',
      list: [{ id: 'VLPL1', name: 'YTM 华语', author: 'YTM', desc: '', img: '', play_count: '', source: 'ytm' }],
      total: 1,
      limit: 18,
    })
    await searchSonglist('华语', 1, 'ytm')
    expect(mocks.ytmSonglistSearch).toHaveBeenCalledOnce()
    expect(songlistListInfos.ytm?.list.map(i => i.id)).toEqual(['VLPL1'])

    // Catalog (artist) 同样在关闭开关时 all 不查 ytm，独立 ytm 标签始终可查
    const txArtist = vi.fn(async() => ({ source: 'tx' as const, list: [{ id: 'tx_a1', name: '周杰伦', img: '', source: 'tx' as const }], total: 1, limit: 20 }))
    const ytmArtist = vi.fn(async() => ({ source: 'ytm' as const, list: [{ id: 'UCjay', name: '周杰伦', img: '', source: 'ytm' as const }], total: 1, limit: 20 }))
    const catalogStore = createCatalogSearchStore(
      (kind, source) => kind === 'artist' ? ({ tx: txArtist, ytm: ytmArtist }[source as 'tx' | 'ytm'] ?? null) : null,
      ['tx', 'ytm'],
    )
    await catalogStore.search('artist', '周杰伦', 1, 'all')
    expect(ytmArtist).not.toHaveBeenCalled()
    await catalogStore.search('artist', '周杰伦', 1, 'ytm')
    expect(ytmArtist).toHaveBeenCalledOnce()
  })

  it('cancelSearch aborts in-flight music and songlist searches cleanly', async() => {
    const req1 = deferred<any>()
    mocks.ytmMusicSearch.mockReturnValueOnce(req1.promise)
    const pending1 = searchMusic('cancel-me', 1, 'ytm')
    cancelMusicSearch('ytm')
    expect(req1.cancel).toHaveBeenCalledOnce()
    req1.reject(new Error('request cancelled'))
    await expect(pending1).resolves.toEqual([])

    const req2 = deferred<any>()
    mocks.ytmSonglistSearch.mockReturnValueOnce(req2.promise)
    const pending2 = searchSonglist('cancel-pl', 1, 'ytm')
    cancelSonglistSearch('ytm')
    expect(req2.cancel).toHaveBeenCalledOnce()
    req2.reject(new Error('request cancelled'))
    await expect(pending2).resolves.toEqual([])
  })

  it('exposes full maxAllPage across page 1 and final page when a smaller-limit source has more pages', async() => {
    // 音乐聚合 limit=30，YTM limit=20 total=41 allPage=3 → 第 1 页和第 3 页均应暴露 3 页
    const ytm3Pages = {
      source: 'ytm',
      list: [{ id: 'ytm_p3', songmid: 'p3', name: '晴天', singer: '周杰伦', source: 'ytm' }],
      total: 41,
      limit: 20,
      allPage: 3,
    }
    const tx1Page = {
      source: 'tx',
      list: [{ id: 'tx_p1', songmid: 't1', name: '晴天', singer: '周杰伦', source: 'tx' }],
      total: 10,
      limit: 30,
      allPage: 1,
    }
    mocks.txMusicSearch.mockResolvedValueOnce(tx1Page)
    mocks.ytmMusicSearch.mockResolvedValueOnce(ytm3Pages)
    await searchMusic('多页对齐', 1, 'all')
    expect(Math.ceil(musicListInfos.all.total / musicListInfos.all.limit)).toBe(3)

    mocks.txMusicSearch.mockResolvedValueOnce(tx1Page)
    mocks.ytmMusicSearch.mockResolvedValueOnce(ytm3Pages)
    await searchMusic('多页对齐', 3, 'all')
    expect(Math.ceil(musicListInfos.all.total / musicListInfos.all.limit)).toBe(3)

    // 中间页（第 2 页）曲目为空但某源仍报告 3 页时，仍保留第 3 页可达
    mocks.txMusicSearch.mockResolvedValueOnce({ source: 'tx', list: [], total: 90, limit: 30, allPage: 3 })
    mocks.ytmMusicSearch.mockResolvedValueOnce({ source: 'ytm', list: [], total: 41, limit: 20, allPage: 3 })
    await searchMusic('空中间页', 2, 'all')
    expect(Math.ceil(musicListInfos.all.total / musicListInfos.all.limit)).toBe(3)

    // Catalog 聚合 limit=15，单源 limit=10 total=21 (allPage=3) → 第 1 页与第 3 页均暴露 3 页
    const smallProvider = vi.fn(async() => ({
      source: 'ytm' as const,
      list: [{ id: 'UC1', name: '周杰伦', img: '', source: 'ytm' as const }],
      total: 21,
      limit: 10,
    }))
    const catalogStore = createCatalogSearchStore(
      (kind, source) => kind === 'artist' && source === 'ytm' ? smallProvider : null,
      ['ytm'],
    )
    await catalogStore.search('artist', '周杰伦', 1, 'all')
    const info1 = catalogStore.getListInfo('artist', 'all')!
    expect(Math.ceil(info1.total / info1.limit)).toBe(3)
    await catalogStore.search('artist', '周杰伦', 3, 'all')
    expect(Math.ceil(info1.total / info1.limit)).toBe(3)
  })

  it('songlist search with partialFailure surfaces error and does not lock completedKeys for retry', async() => {
    mocks.ytmSonglistSearch
      .mockResolvedValueOnce({
        source: 'ytm',
        list: [{ id: 'VLPLpart1', name: '社区歌单', author: 'U', desc: '', img: '', play_count: '', source: 'ytm' }],
        total: 1,
        limit: 18,
        partialFailure: true,
      })
      .mockResolvedValueOnce({
        source: 'ytm',
        list: [
          { id: 'VLPLfeat1', name: '官方歌单', author: 'YTM', desc: '', img: '', play_count: '', source: 'ytm' },
          { id: 'VLPLpart1', name: '社区歌单', author: 'U', desc: '', img: '', play_count: '', source: 'ytm' },
        ],
        total: 2,
        limit: 18,
      })

    const first = await searchSonglist('部分失败重查', 1, 'ytm')
    expect(first.map(i => i.id)).toEqual(['VLPLpart1'])
    expect(songlistListInfos.ytm?.error).toBe('list__load_failed')

    // 再次以同一关键词查询不会命中 completedKeys 短路，成功恢复完整结果
    const retry = await searchSonglist('部分失败重查', 1, 'ytm')
    expect(mocks.ytmSonglistSearch).toHaveBeenCalledTimes(2)
    expect(retry.map(i => i.id)).toEqual(['VLPLfeat1', 'VLPLpart1'])
    expect(songlistListInfos.ytm?.error).toBe('')
  })
})

describe('canDirectDownload & batch download gate for mixed domestic + YTM selection', () => {
  it('enables direct download for YTM tracks with supported _qualitys (.m4a) while filtering tracks lacking _qualitys', async() => {
    const wySong: LX.Music.MusicInfoOnline = {
      id: 'wy_186016',
      name: '晴天',
      singer: '周杰伦',
      source: 'wy',
      interval: '04:29',
      meta: { songId: '186016', albumName: '叶惠美', qualitys: [{ type: '128k', size: '' }], _qualitys: { '128k': { size: '' } } },
    }
    const wyNoQuality: LX.Music.MusicInfoOnline = {
      id: 'wy_noq',
      name: '无音质元数据',
      singer: '周杰伦',
      source: 'wy',
      interval: '04:29',
      meta: { songId: 'noq', albumName: '叶惠美', qualitys: [], _qualitys: {} },
    }
    const wyBadBoolQuality: LX.Music.MusicInfoOnline = {
      id: 'wy_badq',
      name: '异常音质记录',
      singer: '周杰伦',
      source: 'wy',
      interval: '04:29',
      meta: { songId: 'badq', albumName: '叶惠美', qualitys: [], _qualitys: { '128k': true as any } },
    }
    const ytmSong: LX.Music.MusicInfoOnline = {
      id: 'ytm_dQw4w9WgXcQ',
      name: '晴天',
      singer: '周杰伦',
      source: 'ytm',
      interval: '04:29',
      meta: {
        songId: 'dQw4w9WgXcQ',
        albumName: '叶惠美',
        qualitys: [{ type: '128k', size: '' }, { type: '320k', size: '' }],
        _qualitys: { '128k': { size: '' }, '320k': { size: '' } },
      },
    }
    const ytmNoQuality: LX.Music.MusicInfoOnline = {
      id: 'ytm_noq',
      name: '无音质YTM',
      singer: '周杰伦',
      source: 'ytm',
      interval: '04:29',
      meta: { songId: 'noq', albumName: '叶惠美', qualitys: [], _qualitys: {} },
    }

    expect(canDirectDownload(wySong)).toBe(true)
    expect(canDirectDownload(wyNoQuality)).toBe(false)
    expect(canDirectDownload(wyBadBoolQuality)).toBe(false)
    expect(canDirectDownload(ytmSong)).toBe(true)
    expect(canDirectDownload(ytmNoQuality)).toBe(false)

    await createDownloadTasks([wySong, wyNoQuality, ytmSong, ytmNoQuality], '320k')
    expect(mocks.workerCreateDownloadTasks).toHaveBeenCalledTimes(1)
    expect(mocks.workerCreateDownloadTasks.mock.calls[0][0]).toEqual([wySong, ytmSong])
    expect(mocks.workerCreateDownloadTasks.mock.calls[0][3]).toMatchObject({ ytm: ['128k', '320k'] })
    expect(mocks.downloadAdd).toHaveBeenCalledTimes(1)
    const addedTasks = mocks.downloadAdd.mock.calls[0]?.[0] ?? []
    expect(addedTasks.map((t: any) => t.metadata.musicInfo.source)).toEqual(['wy', 'ytm'])

    const ytmDlInfo = createDownloadInfo(ytmSong, '320k', '歌名 - 歌手', { ytm: ['128k', '320k'] })
    expect(ytmDlInfo.metadata.ext).toBe('m4a')
    expect(ytmDlInfo.metadata.quality).toBe('320k')
    expect(ytmDlInfo.metadata.fileName.endsWith('.m4a')).toBe(true)
  })
})
