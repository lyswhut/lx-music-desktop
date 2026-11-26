import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setYtmRuntimeContext } from '@renderer/utils/musicSdk/ytm/runtimeContext'
import {
  clearList,
  clearListDetail,
  getAndSetList,
  getAndSetListDetail,
  getListDetail,
  getListDetailAll,
} from './action'
import { listDetailInfo, listInfo } from './state'
import {
  clearListDetail as clearBoardDetail,
  getAndSetListDetail as getAndSetBoardDetail,
  getListDetailAll as getBoardListAll,
  parseBoardId,
} from '@renderer/store/leaderboard/action'
import { listDetailInfo as boardDetailInfo } from '@renderer/store/leaderboard/state'
import syncSourceList from '@renderer/store/list/syncSourceList'
import { addSongListDetail } from '@renderer/views/songList/Detail/action'

const mocks = vi.hoisted(() => ({
  ytmGetList: vi.fn(),
  ytmGetListDetail: vi.fn(),
  kwGetList: vi.fn(),
  kwGetListDetail: vi.fn(),
  ytmBoardGetList: vi.fn(),
  kwBoardGetList: vi.fn(),
  overwriteListMusics: vi.fn(async() => {}),
  setListUpdateTime: vi.fn(async() => {}),
  setListUpdateError: vi.fn(async() => {}),
  setFetchingListStatus: vi.fn(),
  setUpdateTime: vi.fn(),
  createUserList: vi.fn(async() => {}),
  dialogConfirm: vi.fn(async() => false),
  userLists: [] as LX.List.UserListInfo[],
}))

vi.mock('@renderer/utils/musicSdk', () => ({
  default: {
    sources: [{ id: 'kw' }, { id: 'ytm' }],
    kw: {
      songList: {
        sortList: [{ id: 'new', name: '最新' }],
        getList: mocks.kwGetList,
        getListDetail: mocks.kwGetListDetail,
      },
      leaderboard: {
        getBoards: vi.fn(),
        getList: mocks.kwBoardGetList,
      },
    },
    ytm: {
      songList: {
        sortList: [{ id: 'featured', name: '推荐' }],
        getList: mocks.ytmGetList,
        getListDetail: mocks.ytmGetListDetail,
      },
      leaderboard: {
        getBoards: vi.fn(),
        getList: mocks.ytmBoardGetList,
      },
    },
  },
}))
vi.mock('@renderer/utils', () => ({
  deduplicationList: <T extends { id: string }>(list: T[]) => {
    const seen = new Set<string>()
    return list.filter(item => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  },
  toNewMusicInfo: (raw: any) => {
    // 真实 toNewMusicInfo 会假定传入为旧行结构；若被二次调用会抛错
    if (raw.meta && typeof raw.meta === 'object' && !('songmid' in raw)) {
      throw new Error('toNewMusicInfo must not be called twice on already-normalized MusicInfo')
    }
    return {
      id: `${raw.source}_${raw.songmid}`,
      name: raw.name,
      singer: raw.singer,
      source: raw.source,
      interval: raw.interval ?? '03:00',
      meta: { songId: raw.songmid, albumName: raw.albumName ?? '', qualitys: [], _qualitys: {} },
    }
  },
  toMD5: (s: string) => `md5_${s}`,
}))
vi.mock('@renderer/utils/data', () => ({
  setListUpdateTime: mocks.setListUpdateTime,
  setListUpdateError: mocks.setListUpdateError,
}))
vi.mock('@renderer/store/list/action', () => ({
  setFetchingListStatus: mocks.setFetchingListStatus,
  overwriteListMusics: mocks.overwriteListMusics,
  setUpdateTime: mocks.setUpdateTime,
  createUserList: mocks.createUserList,
  setTempList: vi.fn(async() => {}),
}))
vi.mock('@renderer/store/list/state', () => ({
  get userLists() { return mocks.userLists },
  tempListMeta: { id: null },
}))
vi.mock('@renderer/plugins/Dialog', () => ({
  dialog: { confirm: mocks.dialogConfirm },
}))
vi.mock('@renderer/core/player/action', () => ({
  playList: vi.fn(),
}))

const rawRow = (source: 'ytm' | 'kw', id: string) => ({
  source,
  songmid: id,
  name: `Song ${id}`,
  singer: 'Artist',
  albumName: 'Album',
  interval: '03:30',
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.userLists.length = 0
  clearList()
  clearListDetail()
  clearBoardDetail()
  setYtmRuntimeContext({
    getAppSetting: () => ({ 'recommend.ytm.enable': true }),
    getProxy: () => undefined,
  })
  vi.stubGlobal('window', { i18n: { t: (key: string) => key } })
})

afterEach(() => {
  setYtmRuntimeContext(null)
})

describe('songList & leaderboard YTM pagination, sync guard, non-mutation, and race guards', () => {
  it('getListDetailAll follows 3-page YTM hasMore stream, passes isRefresh only on page 1, and locks context + generation', async() => {
    const pages: Record<number, any> = {
      1: { source: 'ytm', list: [rawRow('ytm', 'v1')], page: 1, limit: 50, total: 51, hasMore: true, truncated: false, generation: 7, info: { name: 'P' } },
      2: { source: 'ytm', list: [rawRow('ytm', 'v2')], page: 2, limit: 50, total: 101, hasMore: true, truncated: false, generation: 7, info: { name: 'P' } },
      3: { source: 'ytm', list: [rawRow('ytm', 'v3')], page: 3, limit: 50, total: 103, hasMore: false, truncated: false, generation: 7, info: { name: 'P' } },
    }
    mocks.ytmGetListDetail.mockImplementation(async(_id: string, page: number) => pages[page])

    const all = await getListDetailAll('VLPL3pages', 'ytm', true)
    expect(all.map(s => s.id)).toEqual(['ytm_v1', 'ytm_v2', 'ytm_v3'])
    expect(mocks.ytmGetListDetail.mock.calls).toEqual([
      ['VLPL3pages', 1, true, { ctx: expect.objectContaining({ lockedProxy: false, contextKey: 'direct' }) }],
      ['VLPL3pages', 2, false, { ctx: expect.objectContaining({ lockedProxy: false, contextKey: 'direct' }), expectedGeneration: 7 }],
      ['VLPL3pages', 3, false, { ctx: expect.objectContaining({ lockedProxy: false, contextKey: 'direct' }), expectedGeneration: 7 }],
    ])
  })

  it('leaderboard parseBoardId splits on first __ only and getBoardListAll fetches all 3 pages with generation lock', async() => {
    expect(parseBoardId('ytm__VLPLabc__def__123')).toEqual(['ytm', 'VLPLabc__def__123'])

    const pages: Record<number, any> = {
      1: { source: 'ytm', list: [rawRow('ytm', 'b1')], page: 1, limit: 50, total: 51, hasMore: true, truncated: false, generation: 9 },
      2: { source: 'ytm', list: [rawRow('ytm', 'b2')], page: 2, limit: 50, total: 101, hasMore: true, truncated: false, generation: 9 },
      3: { source: 'ytm', list: [rawRow('ytm', 'b3')], page: 3, limit: 50, total: 103, hasMore: false, truncated: false, generation: 9 },
    }
    mocks.ytmBoardGetList.mockImplementation(async(_id: string, page: number) => pages[page])

    const all = await getBoardListAll('ytm__VLPLabc__def', true)
    expect(all.map(s => s.id)).toEqual(['ytm_b1', 'ytm_b2', 'ytm_b3'])
    expect(mocks.ytmBoardGetList.mock.calls).toEqual([
      ['VLPLabc__def', 1, true, { ctx: expect.objectContaining({ lockedProxy: false, contextKey: 'direct' }) }],
      ['VLPLabc__def', 2, false, { ctx: expect.objectContaining({ lockedProxy: false, contextKey: 'direct' }), expectedGeneration: 9 }],
      ['VLPLabc__def', 3, false, { ctx: expect.objectContaining({ lockedProxy: false, contextKey: 'direct' }), expectedGeneration: 9 }],
    ])
  })

  it('getListDetailAll and getBoardListAll abort if YTM proxy changes mid-sync, and empty page > 1 clears loading label', async() => {
    mocks.ytmGetListDetail.mockImplementationOnce(async() => {
      // 模拟同步中途切换代理
      setYtmRuntimeContext({
        getAppSetting: () => ({ 'recommend.ytm.enable': true, 'recommend.ytm.proxy.enable': true, 'recommend.ytm.proxy.host': '127.0.0.1', 'recommend.ytm.proxy.port': '7890' }),
        getProxy: () => undefined,
      })
      return { source: 'ytm', list: [rawRow('ytm', 'p1')], page: 1, limit: 50, total: 51, hasMore: true, truncated: false, generation: 1, info: {} }
    })
    await expect(getListDetailAll('VLPLswitch', 'ytm', true)).rejects.toThrow(/代理配置已变更/)

    // 空的第 2 页应清掉 list__loading，不得卡死在加载中
    mocks.ytmGetListDetail.mockResolvedValueOnce({ source: 'ytm', list: [], page: 2, limit: 50, total: 50, hasMore: false, truncated: false, info: {} })
    await getAndSetListDetail('VLPLempty2', 'ytm', 2)
    expect(listDetailInfo.noItemLabel).toBe('')

    mocks.ytmBoardGetList.mockResolvedValueOnce({ source: 'ytm', list: [], page: 2, limit: 50, total: 50, hasMore: false, truncated: false })
    await getAndSetBoardDetail('ytm__VLPLemptyBoard', 2)
    expect(boardDetailInfo.noItemLabel).toBe('')
  })

  it('same-key consecutive refreshes ignore superseded earlier rejections and out-of-order resolutions', async() => {
    let rejectFirstList!: (err: Error) => void
    mocks.ytmGetList
      .mockReturnValueOnce(new Promise((_resolve, reject) => { rejectFirstList = reject }))
      .mockResolvedValueOnce({
        source: 'ytm',
        list: [{ id: 'VLPLfresh', name: 'Fresh', author: 'YTM', desc: '', img: '', play_count: '', source: 'ytm' }],
        total: 1,
        page: 1,
        limit: 30,
      })

    const req1 = getAndSetList('ytm', '', 'featured', 1, true)
    const req2 = getAndSetList('ytm', '', 'featured', 1, true)
    rejectFirstList(new Error('request cancelled'))
    await Promise.all([req1, req2])
    expect(listInfo.list.map(i => i.id)).toEqual(['VLPLfresh'])
    expect(listInfo.noItemLabel).toBe('')

    let resolveOldDetail!: (val: any) => void
    mocks.ytmGetListDetail
      .mockReturnValueOnce(new Promise(resolve => { resolveOldDetail = resolve }))
      .mockResolvedValueOnce({ source: 'ytm', list: [rawRow('ytm', 'new_track')], page: 1, limit: 50, total: 1, info: { name: 'New' } })
    const d1 = getAndSetListDetail('VLPLsame', 'ytm', 1, true)
    const d2 = getAndSetListDetail('VLPLsame', 'ytm', 1, true)
    await d2
    resolveOldDetail({ source: 'ytm', list: [rawRow('ytm', 'old_track')], page: 1, limit: 50, total: 1, info: { name: 'Old' } })
    await d1
    expect(listDetailInfo.list.map(s => s.id)).toEqual(['ytm_new_track'])

    let rejectOldBoard!: (err: Error) => void
    mocks.ytmBoardGetList
      .mockReturnValueOnce(new Promise((_resolve, reject) => { rejectOldBoard = reject }))
      .mockResolvedValueOnce({ source: 'ytm', list: [rawRow('ytm', 'new_b')], page: 1, limit: 50, total: 1 })
    const b1 = getAndSetBoardDetail('ytm__VLPLsameB', 1, true)
    const b2 = getAndSetBoardDetail('ytm__VLPLsameB', 1, true)
    rejectOldBoard(new Error('request cancelled'))
    await Promise.all([b1, b2])
    expect(boardDetailInfo.list.map(s => s.id)).toEqual(['ytm_new_b'])
    expect(boardDetailInfo.noItemLabel).toBe('')
  })

  it('syncSourceList refuses to overwrite saved playlist or board when YTM stream is truncated at max depth', async() => {
    mocks.ytmGetListDetail.mockResolvedValue({
      source: 'ytm',
      list: [rawRow('ytm', 't1')],
      page: 1,
      limit: 50,
      total: 500,
      hasMore: false,
      truncated: true,
      info: {},
    })
    const savedPlaylist: LX.List.UserListInfo = {
      id: 'ytm_saved',
      name: 'My YTM Playlist',
      source: 'ytm',
      sourceListId: 'VLPLhuge',
      locationUpdateTime: null,
    }

    await expect(syncSourceList(savedPlaylist)).rejects.toThrow(/截断/)
    expect(mocks.overwriteListMusics).not.toHaveBeenCalled()
    expect(mocks.setListUpdateTime).not.toHaveBeenCalled()

    // 国内源返回数字字符串 total/limit（如酷我 rn="2"、total="5"）必须正常翻完全部 3 页而非首屏截断
    mocks.kwGetListDetail
      .mockResolvedValueOnce({ source: 'kw', list: [rawRow('kw', 'k1'), rawRow('kw', 'k2')], page: 1, limit: '2', total: '5', info: {} })
      .mockResolvedValueOnce({ source: 'kw', list: [rawRow('kw', 'k3'), rawRow('kw', 'k4')], page: 2, limit: '2', total: '5', info: {} })
      .mockResolvedValueOnce({ source: 'kw', list: [rawRow('kw', 'k5')], page: 3, limit: '2', total: '5', info: {} })
    const kwAll = await getListDetailAll('kw_str_pages', 'kw', true, { failOnTruncated: true })
    expect(kwAll.map(i => i.id)).toEqual(['kw_k1', 'kw_k2', 'kw_k3', 'kw_k4', 'kw_k5'])

    // 严格同步遇到缺失/非法/非正分页字段（undefined / null / '' / 0）且列表非空时均拒绝覆盖旧收藏
    for (const badTotal of [undefined, null, '', 0]) {
      mocks.kwGetListDetail.mockResolvedValueOnce({ source: 'kw', list: [rawRow('kw', 'kBad')], page: 1, limit: 50, total: badTotal, info: {} })
      await expect(getListDetailAll(`kw_bad_total_${String(badTotal)}`, 'kw', true, { failOnTruncated: true })).rejects.toThrow(/分页信息异常/)

      mocks.kwBoardGetList.mockResolvedValueOnce({ source: 'kw', list: [rawRow('kw', 'kbBad')], page: 1, limit: 50, total: badTotal })
      await expect(getBoardListAll(`kw__bad_${String(badTotal)}`, true, { failOnTruncated: true })).rejects.toThrow(/分页信息异常/)
    }
    expect(mocks.setListUpdateError).toHaveBeenCalledWith('ytm_saved', expect.stringContaining('截断'))

    mocks.ytmBoardGetList.mockResolvedValue({
      source: 'ytm',
      list: [rawRow('ytm', 'tb1')],
      page: 1,
      limit: 50,
      total: 500,
      hasMore: false,
      truncated: true,
    })
    const savedBoard: LX.List.UserListInfo = {
      id: 'ytm_board_saved',
      name: 'My YTM Board',
      source: 'ytm',
      sourceListId: 'board__ytm__VLPLchart__x',
      locationUpdateTime: null,
    }
    await expect(syncSourceList(savedBoard)).rejects.toThrow(/截断/)
    expect(mocks.overwriteListMusics).not.toHaveBeenCalled()
  })

  it('getListDetail never mutates the object returned by SDK across repeated reads', async() => {
    const sharedSdkResult = {
      source: 'ytm',
      list: [rawRow('ytm', 'm1')],
      page: 1,
      limit: 50,
      total: 1,
      hasMore: false,
      truncated: false,
      info: { name: 'Immutable' },
    }
    mocks.ytmGetListDetail.mockResolvedValue(sharedSdkResult)

    const first = await getListDetail('VLPLimm', 'ytm', 1)
    const second = await getListDetail('VLPLimm', 'ytm', 1)
    expect(first.list[0].id).toBe('ytm_m1')
    expect(second.list[0].id).toBe('ytm_m1')
    // 原始 SDK 对象的 list 仍保持未转换旧行结构，未被原地污染
    expect((sharedSdkResult.list[0] as any).songmid).toBe('m1')
  })

  it('stale YTM failure never clears newly switched domestic listInfo, listDetailInfo, or boardDetailInfo', async() => {
    let rejectYtmList!: (err: Error) => void
    mocks.ytmGetList.mockReturnValue(new Promise((_resolve, reject) => { rejectYtmList = reject }))
    mocks.kwGetList.mockResolvedValue({
      source: 'kw',
      list: [{ id: 'kw_pl_1', name: 'KW Playlist', author: 'A', desc: '', img: '', play_count: '1', source: 'kw' }],
      total: 1,
      page: 1,
      limit: 30,
    })

    const staleListReq = getAndSetList('ytm', '', 'featured', 1)
    await getAndSetList('kw', '', 'new', 1)
    rejectYtmList(new Error('ytm offline'))
    await staleListReq
    expect(listInfo.source).toBe('kw')
    expect(listInfo.list.map(i => i.id)).toEqual(['kw_pl_1'])

    let rejectYtmDetail!: (err: Error) => void
    mocks.ytmGetListDetail.mockReturnValue(new Promise((_resolve, reject) => { rejectYtmDetail = reject }))
    mocks.kwGetListDetail.mockResolvedValue({
      source: 'kw',
      list: [rawRow('kw', 'kw_s1')],
      total: 1,
      page: 1,
      limit: 30,
      info: { name: 'KW Detail' },
    })

    const staleDetailReq = getAndSetListDetail('VLPLstale', 'ytm', 1)
    await getAndSetListDetail('kw_123', 'kw', 1)
    rejectYtmDetail(new Error('ytm detail failed'))
    await staleDetailReq
    expect(listDetailInfo.source).toBe('kw')
    expect(listDetailInfo.list.map(s => s.id)).toEqual(['kw_kw_s1'])

    let rejectYtmBoard!: (err: Error) => void
    mocks.ytmBoardGetList.mockReturnValue(new Promise((_resolve, reject) => { rejectYtmBoard = reject }))
    mocks.kwBoardGetList.mockResolvedValue({
      source: 'kw',
      list: [rawRow('kw', 'kw_b1')],
      total: 1,
      page: 1,
      limit: 30,
    })

    const staleBoardReq = getAndSetBoardDetail('ytm__VLPLstale', 1)
    await getAndSetBoardDetail('kw__16', 1)
    rejectYtmBoard(new Error('ytm board failed'))
    await staleBoardReq
    expect(boardDetailInfo.source).toBe('kw')
    expect(boardDetailInfo.list.map(s => s.id)).toEqual(['kw_kw_b1'])
  })

  it('addSongListDetail canonicalizes PL... and VLPL... IDs to prevent duplicate YTM collections', async() => {
    mocks.userLists.push({
      id: 'ytm_existing',
      name: '已收藏 YTM 歌单',
      source: 'ytm',
      sourceListId: 'VLPLsame123456',
      locationUpdateTime: null,
    })
    await addSongListDetail('PLsame123456', 'ytm', 'YTM 歌单')
    expect(mocks.dialogConfirm).toHaveBeenCalledOnce()
    expect(mocks.createUserList).not.toHaveBeenCalled()
  })

  it('first-time YTM addSongListDetail enforces failOnTruncated and partial getAndSetList allows recovery without force refresh', async() => {
    mocks.ytmGetListDetail.mockResolvedValueOnce({
      source: 'ytm',
      list: [rawRow('ytm', 'tr1')],
      page: 1,
      limit: 50,
      total: 500,
      hasMore: false,
      truncated: true,
      info: { name: 'Truncated' },
    })
    await expect(addSongListDetail('PLtruncated999', 'ytm', 'Truncated')).rejects.toThrow(/截断/)
    expect(mocks.createUserList).not.toHaveBeenCalled()

    // 部分失败的 YTM 歌单列表不命中同键短路，下次非强制刷新可自动重查恢复完整列表
    mocks.ytmGetList
      .mockResolvedValueOnce({
        source: 'ytm',
        list: [{ id: 'VLPLlocal12345', name: '本地榜', author: 'YTM', desc: '', img: '', play_count: '', source: 'ytm' }],
        total: 1,
        page: 1,
        limit: 30,
        partial: true,
      })
      .mockResolvedValueOnce({
        source: 'ytm',
        list: [
          { id: 'VLPLlocal12345', name: '本地榜', author: 'YTM', desc: '', img: '', play_count: '', source: 'ytm' },
          { id: 'VLPLglobal1234', name: '全球榜', author: 'YTM', desc: '', img: '', play_count: '', source: 'ytm' },
        ],
        total: 2,
        page: 1,
        limit: 30,
      })
    await getAndSetList('ytm', '', 'charts', 1, false)
    expect(listInfo.list.map(i => i.id)).toEqual(['VLPLlocal12345'])
    await getAndSetList('ytm', '', 'charts', 1, false)
    expect(mocks.ytmGetList).toHaveBeenCalledTimes(2)
    expect(listInfo.list.map(i => i.id)).toEqual(['VLPLlocal12345', 'VLPLglobal1234'])

    // 国内源同键连续刷新时，迟到的旧响应不得覆盖新缓存
    let resolveOldKw!: (val: any) => void
    mocks.kwGetListDetail
      .mockReturnValueOnce(new Promise(resolve => { resolveOldKw = resolve }))
      .mockResolvedValueOnce({ source: 'kw', list: [rawRow('kw', 'kw_new')], page: 1, limit: 30, total: 1, info: { name: 'New' } })
    const kwOld = getListDetail('kw_race_cache', 'kw', 1, true)
    const kwNew = await getListDetail('kw_race_cache', 'kw', 1, true)
    expect(kwNew.list.map(s => s.id)).toEqual(['kw_kw_new'])
    resolveOldKw({ source: 'kw', list: [rawRow('kw', 'kw_old')], page: 1, limit: 30, total: 1, info: { name: 'Old' } })
    await kwOld
    const cachedKw = await getListDetail('kw_race_cache', 'kw', 1, false)
    expect(cachedKw.list.map(s => s.id)).toEqual(['kw_kw_new'])
  })
})
