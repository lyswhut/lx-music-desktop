import { expect, it, vi } from 'vitest'
import useList from '@renderer/views/Search/MusicList/useList'
import { playList } from '@renderer/core/player/action'
import { isProviderServable } from '@renderer/core/music/sourceRotation'
import { search as mockSearchMusic } from '@renderer/store/search/music'

const mocks = vi.hoisted(() => ({ songs: [] as any[] }))
vi.mock('@renderer/core/player/action', () => ({ playList: vi.fn() }))
vi.mock('@renderer/store/list/action', () => ({ getListMusics: async() => mocks.songs, addListMusics: vi.fn(async() => {}) }))
vi.mock('@renderer/store/search/action', () => ({ addHistoryWord: vi.fn(async() => {}) }))
vi.mock('@renderer/store/search/music', () => ({
  search: vi.fn(),
  listInfos: {
    all: { page: 1, maxPage: 0, limit: 30, total: 0, list: [], key: null, noItemLabel: '' },
    kw: { page: 1, maxPage: 0, limit: 30, total: 0, list: [], key: null, noItemLabel: '' },
  },
}))
vi.mock('@common/utils/nodejs', () => ({ joinPath: vi.fn() }))
vi.mock('@renderer/utils/ipc', () => ({ getThemes: vi.fn() }))
vi.mock('@renderer/store/setting', () => ({ appSetting: { 'common.apiSource': 'primary', 'common.apiSourceBackups': ['backup'] } }))
vi.mock('@renderer/store', () => ({
  qualityList: { value: { kw: ['128k'] } },
  userApi: { apis: { backup: { wy: { getMusicUrl: vi.fn() } } }, qualityLists: { backup: { wy: ['128k'] } } },
  themeInfo: {},
  themeShouldUseDarkColors: {},
}))

it('仅备源支持的平台，搜索结果仍应能进入播放回退链', async() => {
  const env = { primaryApiId: 'primary', primaryServedProviders: ['kw'], backupApiIds: ['backup'], readyApiIds: ['backup'], servedProviders: { backup: ['wy'] } }
  expect(isProviderServable(env, 'wy')).toBe(true)
  const song = { id: 'wy_1', source: 'wy', name: 'Song', singer: 'Artist', interval: null, meta: { songId: '1', albumName: '', qualitys: [], _qualitys: { '128k': { size: null } } } }
  mocks.songs = [song]
  const search = useList()
  search.listInfo.value.list = [song] as any
  await search.handlePlayList(0)
  expect(playList).toHaveBeenCalled()
})

it('聚合搜索在发起时归顶一次，YTM 延迟收敛后不再二次拉回顶部', async() => {
  vi.useFakeTimers()
  try {
    let resolveSearch!: (list: any[]) => void
    vi.mocked(mockSearchMusic).mockReturnValueOnce(new Promise(resolve => { resolveSearch = resolve }))
    const scrollToTop = vi.fn()
    const { listRef, search } = useList()
    listRef.value = { scrollToTop }

    const pending = search('晴天', 'all', 1)
    vi.runAllTimers()
    expect(scrollToTop).toHaveBeenCalledTimes(1)

    // 模拟 4 秒后 YTM 收敛（国内源此前已渲染完毕，用户可能已滚动）
    resolveSearch([{ id: 'tx_1' }])
    await pending
    vi.runAllTimers()
    expect(scrollToTop).toHaveBeenCalledTimes(1)
  } finally {
    vi.useRealTimers()
  }
})
