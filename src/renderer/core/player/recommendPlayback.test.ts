import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { playMusicInfoNow, playMusicSelection, restartSelectedVersion, getNextPlayMusicInfo, resetRandomNextMusicInfo, playNext, setMusicUrl, collectMusic, uncollectMusic, handlePlayerPicError } from './action'
import { playInfo, playMusicInfo, tempPlayList, playedList } from '@renderer/store/player/state'
import { clearTempPlayeList, setPlayMusicInfo, removeTempPlayList, addPlayedList, getList, setMusicInfo } from '@renderer/store/player/action'
import { setResource, setStop } from '@renderer/plugins/player'
import { getMusicUrl, getPicPath, getLyricInfo } from '../music/index'
import { writebackToggleMusicInfo } from '../music/toggleWriteback'
import { getMusicUrl as getOnlineMusicUrl } from '../music/online'
import { filterList } from './utils'
import { appSetting } from '@renderer/store/setting'
import { addListMusics, removeListMusics } from '@renderer/store/list/action'

const urlCache = vi.hoisted(() => ({ entries: new Map<string, LX.Music.MusicUrlInfo>(), resolve: vi.fn() }))
vi.mock('../music/utils', () => ({
  getPlayQuality: () => '128k',
  handleGetOnlineMusicUrl: urlCache.resolve,
}))
vi.mock('@renderer/utils/ipc', () => ({
  getMusicUrl: async(info: LX.Music.MusicInfo, quality: LX.Quality) => urlCache.entries.get(`${info.id}_${quality}`)?.url ?? '',
  getMusicUrlInfo: async(info: LX.Music.MusicInfo, quality: LX.Quality) => urlCache.entries.get(`${info.id}_${quality}`) ?? null,
  saveMusicUrl: async(info: LX.Music.MusicInfo, quality: LX.Quality, url: string, musicInfo?: LX.Music.MusicInfoOnline) => {
    const id = `${info.id}_${quality}`
    urlCache.entries.set(id, { id, url, musicInfo })
  },
}))

vi.mock('@renderer/plugins/player', () => ({ isEmpty: vi.fn(), setPause: vi.fn(), setPlay: vi.fn(), setResource: vi.fn(), setStop: vi.fn() }))
vi.mock('@renderer/store/player/state', () => ({
  isPlay: { value: false },
  playedList: [],
  tempPlayList: [],
  musicInfo: {},
  playInfo: { playerListId: 'original', playerPlayIndex: 4 },
  playMusicInfo: { musicInfo: null, listId: 'original', isTempPlay: false },
}))
vi.mock('@renderer/store/player/action', () => ({
  getList: vi.fn(),
  getPlaybackList: (...args: any[]) => (getList as any)(...args),
  addTempPlayList: vi.fn((items: LX.Player.PlayMusicInfo[]) => { tempPlayList.push(...items.map(item => ({ ...item, isTempPlay: true }))) }),
  clearPlayedList: vi.fn(),
  clearTempPlayeList: vi.fn(() => { tempPlayList.splice(0) }),
  setPlayMusicInfo: vi.fn(),
  addPlayedList: vi.fn(),
  setMusicInfo: vi.fn(),
  setAllStatus: vi.fn(),
  removeTempPlayList: vi.fn(),
  setPlayListId: vi.fn(id => { playInfo.playerListId = id }),
  removePlayedList: vi.fn(),
}))
vi.mock('@renderer/store/setting', () => ({ appSetting: { 'player.togglePlayMethod': 'random' } }))
vi.mock('../music/index', () => ({
  getMusicUrl: vi.fn(async() => null),
  getPicPath: vi.fn(async() => null),
  getLyricInfo: vi.fn(async() => ({ rawlrcInfo: { lyric: '' } })),
}))
vi.mock('../music/toggleWriteback', () => ({ writebackToggleMusicInfo: vi.fn(async() => {}) }))
vi.mock('./utils', () => ({ filterList: vi.fn() }))
vi.mock('@renderer/utils/message', () => ({ requestMsg: {} }))
vi.mock('@renderer/utils/index', () => ({ getRandom: vi.fn() }))
vi.mock('@renderer/store/list/action', () => ({ addListMusics: vi.fn(), removeListMusics: vi.fn() }))
vi.mock('@renderer/store/list/state', () => ({ loveList: {} }))
vi.mock('@renderer/core/dislikeList', () => ({ addDislikeInfo: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  urlCache.entries.clear()
  tempPlayList.splice(0)
  playMusicInfo.alternativeMusicInfos = undefined
  vi.stubGlobal('window', {
    lx: { isPlayedStop: false },
    i18n: { t: (value: string) => value },
    app_event: { stop: vi.fn(), pause: vi.fn(), picUpdated: vi.fn(), lyricUpdated: vi.fn(), error: vi.fn() },
  })
  vi.mocked(setPlayMusicInfo).mockImplementation((listId, musicInfo, isTempPlay = false, alternativeMusicInfos) => {
    Object.assign(playMusicInfo, { listId, musicInfo, isTempPlay, alternativeMusicInfos })
  })
  vi.mocked(removeTempPlayList).mockImplementation(index => { tempPlayList.splice(index, 1) })
})
afterEach(async() => {
  // 排空取 URL/歌词 Promise 后再撤除播放器事件环境。
  for (let i = 0; i < 10; i++) await Promise.resolve()
  vi.unstubAllGlobals()
})
it('路径即播标记为临时播放并重新启动播放，保留原列表位置和稍后播放', () => {
  const song: LX.Music.MusicInfo = { id: 'recommended', name: 'Recommended', singer: 'Artist', source: 'wy', interval: null, meta: { songId: 'recommended', albumName: '', qualitys: [], _qualitys: {} } }
  tempPlayList.push({ listId: 'later', musicInfo: song, isTempPlay: true })
  playMusicInfoNow(song)
  expect(setPlayMusicInfo).toHaveBeenCalledWith(null, song, true, undefined)
  expect(setStop).toHaveBeenCalledOnce()
  expect(clearTempPlayeList).not.toHaveBeenCalled()
  expect(addPlayedList).not.toHaveBeenCalled()
  expect(playInfo.playerPlayIndex).toBe(4)
  expect(tempPlayList).toHaveLength(1)
})
it('下一曲消费 FIFO 队首一次，继续保持临时播放身份', async() => {
  const song: LX.Music.MusicInfo = { id: 'next', name: 'Next', singer: 'Artist', source: 'wy', interval: null, meta: { songId: 'next', albumName: '', qualitys: [], _qualitys: {} } }
  tempPlayList.push({ listId: 'later', musicInfo: song, isTempPlay: true })
  await playNext()
  expect(removeTempPlayList).toHaveBeenCalledExactlyOnceWith(0)
  expect(setPlayMusicInfo).toHaveBeenCalledWith('later', song, true, undefined, 'user')
  expect(tempPlayList).toHaveLength(0)
})

const onlineSong = (id: string, source: 'kw' | 'wy' = 'kw'): LX.Music.MusicInfo_online_common => ({
  id,
  source,
  name: 'Song',
  singer: 'Artist',
  interval: null,
  meta: { songId: id, albumName: '', qualitys: [], _qualitys: {} },
})

it('播放器接受 URL 后才执行换源写回', async() => {
  const original = onlineSong('kw_original')
  const replacement = onlineSong('wy_replacement', 'wy')
  playMusicInfo.musicInfo = original
  vi.mocked(getMusicUrl).mockImplementationOnce(async({ onResolvedMusicInfo }) => {
    onResolvedMusicInfo?.(replacement)
    return 'https://example.test/music'
  })
  setMusicUrl(original)
  await vi.waitFor(() => { expect(writebackToggleMusicInfo).toHaveBeenCalledWith(original, replacement) })
  expect(vi.mocked(setResource).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(writebackToggleMusicInfo).mock.invocationCallOrder[0])
})

it('预加载替代源不占用原版缓存键，正式播放重新尝试原版', async() => {
  const original = onlineSong('kw_preloaded')
  const replacement = onlineSong('wy_preloaded', 'wy')
  urlCache.resolve.mockResolvedValueOnce({ url: 'cached-fallback', quality: '128k', musicInfo: replacement, isFromCache: false })
  // 与 usePreloadNextMusic 一样不传身份回调，预加载不得提交播放身份或列表写回。
  await expect(getOnlineMusicUrl({ musicInfo: original, isRefresh: false })).resolves.toBe('cached-fallback')
  expect(writebackToggleMusicInfo).not.toHaveBeenCalled()
  expect(setResource).not.toHaveBeenCalled()
  expect(original.meta.toggleMusicInfo).toBeUndefined()

  expect(urlCache.entries.has('kw_preloaded_128k')).toBe(false)
  expect(urlCache.entries.get('wy_preloaded_128k')?.musicInfo).toBe(replacement)
  urlCache.resolve.mockResolvedValueOnce({ url: 'original-restored', quality: '128k', musicInfo: original, isFromCache: false })
  playMusicInfo.musicInfo = original
  vi.mocked(getMusicUrl).mockImplementationOnce(getOnlineMusicUrl as typeof getMusicUrl)
  setMusicUrl(original)
  await vi.waitFor(() => { expect(writebackToggleMusicInfo).toHaveBeenCalledWith(original, original) })
  expect(urlCache.resolve).toHaveBeenCalledTimes(2)
  expect(setResource).toHaveBeenCalledWith('original-restored')
  expect(vi.mocked(setResource).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(writebackToggleMusicInfo).mock.invocationCallOrder[0])
})

it('刷新回原提供方后，缓存不再报告旧换源身份', async() => {
  const original = onlineSong('kw_refresh')
  const replacement = onlineSong('wy_old', 'wy')
  urlCache.entries.set('kw_refresh_128k', { id: 'kw_refresh_128k', url: 'old', musicInfo: replacement })
  urlCache.resolve.mockResolvedValueOnce({ url: 'fresh', quality: '128k', musicInfo: original, isFromCache: false })
  await getOnlineMusicUrl({ musicInfo: original, isRefresh: true })
  const resolved = vi.fn()
  await expect(getOnlineMusicUrl({ musicInfo: original, isRefresh: false, onResolvedMusicInfo: resolved })).resolves.toBe('fresh')
  expect(resolved).toHaveBeenCalledExactlyOnceWith(original)
})

it('取流期间已切歌则不写回迟到结果', async() => {
  const original = onlineSong('kw_old')
  let resolveUrl!: (url: string) => void
  playMusicInfo.musicInfo = original
  vi.mocked(getMusicUrl).mockImplementationOnce(async({ onResolvedMusicInfo }) => {
    onResolvedMusicInfo?.(onlineSong('wy_old', 'wy'))
    return new Promise(resolve => { resolveUrl = resolve })
  })
  setMusicUrl(original)
  await vi.waitFor(() => { expect(resolveUrl).toBeDefined() })
  playMusicInfo.musicInfo = onlineSong('other')
  resolveUrl('https://example.test/old')
  for (let i = 0; i < 10; i++) await Promise.resolve()
  expect(setResource).not.toHaveBeenCalled()
  expect(writebackToggleMusicInfo).not.toHaveBeenCalled()
})


it('FIFO 与路径播放把备用条目交给取流，普通播放清除旧备用条目', async() => {
  const song = onlineSong('kw_with_alternative')
  const alternatives = [onlineSong('wy_alternative', 'wy')]
  vi.mocked(getMusicUrl).mockResolvedValue(null as any)
  tempPlayList.push({ listId: 'later', musicInfo: song, isTempPlay: true, alternativeMusicInfos: alternatives })
  await playNext()
  await vi.waitFor(() => { expect(getMusicUrl).toHaveBeenCalledWith(expect.objectContaining({ musicInfo: song, alternativeMusicInfos: alternatives })) })
  playMusicInfoNow(onlineSong('path'), null, alternatives)
  expect(setPlayMusicInfo).toHaveBeenLastCalledWith(null, expect.objectContaining({ id: 'path' }), true, alternatives)
  playMusicInfoNow(onlineSong('ordinary'))
  expect(playMusicInfo.alternativeMusicInfos).toBeUndefined()
})

it.each(['success', 'failure'])('旧歌曲请求%s后不能清掉其换源歌曲的新请求', async(outcome) => {
  const original = onlineSong('kw_pending')
  const replacement = onlineSong('wy_pending', 'wy')
  original.meta.toggleMusicInfo = replacement
  let resolveOld!: (url: string) => void
  let rejectOld!: (error: Error) => void
  let resolveNew!: (url: string) => void
  vi.mocked(getMusicUrl)
    .mockImplementationOnce(async() => new Promise((resolve, reject) => { resolveOld = resolve; rejectOld = reject }))
    .mockImplementationOnce(async() => new Promise(resolve => { resolveNew = resolve }))

  playMusicInfo.musicInfo = original
  setMusicUrl(original)
  await vi.waitFor(() => { expect(resolveOld).toBeDefined() })
  playMusicInfo.musicInfo = replacement
  setMusicUrl(replacement)
  await vi.waitFor(() => { expect(resolveNew).toBeDefined() })
  if (outcome === 'success') resolveOld('old-url')
  else rejectOld(new Error('old request failed'))
  for (let i = 0; i < 20; i++) await Promise.resolve()
  expect(setResource).not.toHaveBeenCalled()
  expect(window.app_event.error).not.toHaveBeenCalled()
  resolveNew('new-url')
  await vi.waitFor(() => { expect(setResource).toHaveBeenCalledExactlyOnceWith('new-url') })
  expect(getMusicUrl).toHaveBeenCalledTimes(2)
})

it('A→B→A 快速切换时相同歌曲的旧请求也不能提交结果', async() => {
  const first = onlineSong('kw_repeat')
  const middle = onlineSong('kw_middle')
  const releases: Array<(url: string) => void> = []
  vi.mocked(getMusicUrl).mockImplementation(async() => new Promise(resolve => { releases.push(resolve) }))
  for (const song of [first, middle, first]) {
    playMusicInfo.musicInfo = song
    setMusicUrl(song)
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }
  expect(releases).toHaveLength(3)
  releases[0]('stale-first')
  releases[1]('stale-middle')
  for (let i = 0; i < 20; i++) await Promise.resolve()
  expect(setResource).not.toHaveBeenCalled()
  releases[2]('current-first')
  await vi.waitFor(() => { expect(setResource).toHaveBeenCalledExactlyOnceWith('current-first') })
})

it.each(['ended', 'error', 'removed'] as const)('自动切歌把 %s 原因传给播放状态', async(reason) => {
  const song = onlineSong(`next-${reason}`)
  vi.mocked(getMusicUrl).mockResolvedValue('next-url')
  tempPlayList.push({ listId: 'later', musicInfo: song, isTempPlay: true })
  await playNext(true, reason)
  expect(setPlayMusicInfo).toHaveBeenCalledWith('later', song, true, undefined, reason)
})


it('explicit selection replaces old pending tracks, preserves order and detaches previous list', async() => {
  const selection = [onlineSong('third'), onlineSong('first'), onlineSong('second')]
  tempPlayList.push({ listId: 'old', musicInfo: onlineSong('old'), isTempPlay: true })
  playMusicSelection(selection, 'selected-list')
  expect(playInfo.playerListId).toBeNull()
  expect(playMusicInfo.musicInfo?.id).toBe('third')
  expect(tempPlayList.map(item => item.musicInfo.id)).toEqual(['first', 'second'])
  await playNext()
  expect(playMusicInfo.musicInfo?.id).toBe('first')
  await playNext()
  expect(playMusicInfo.musicInfo?.id).toBe('second')
  expect(tempPlayList).toHaveLength(0)
})


it('changing a manual version restarts only that song and preserves pending queue', () => {
  const original = onlineSong('original')
  const updated = { ...original, meta: { ...original.meta, toggleMusicInfo: onlineSong('selected'), manualVersionPinned: true } }
  Object.assign(playMusicInfo, { musicInfo: original, listId: 'love', isTempPlay: false })
  const pending = { listId: 'later', musicInfo: onlineSong('queued'), isTempPlay: true }
  tempPlayList.push(pending)
  restartSelectedVersion('love', updated)
  expect(playMusicInfo.musicInfo).toBe(updated)
  expect(playMusicInfo.isTempPlay).toBe(false)
  expect(tempPlayList).toEqual([pending])
  expect(clearTempPlayeList).not.toHaveBeenCalled()
})
it('sequential next preview and playback do not skip the first song when current track disappeared', async() => {
  const tracks = [onlineSong('first'), onlineSong('second')]
  appSetting['player.togglePlayMethod'] = 'list'
  Object.assign(playInfo, { playerListId: 'list', playerPlayIndex: 0 })
  Object.assign(playMusicInfo, { musicInfo: onlineSong('removed'), listId: 'list', isTempPlay: false })
  resetRandomNextMusicInfo()
  vi.mocked(getList).mockReturnValue(tracks)
  vi.mocked(filterList).mockResolvedValue({ filteredList: tracks, playerIndex: -1 })
  expect((await getNextPlayMusicInfo())?.musicInfo.id).toBe('first')
  await playNext(true)
  expect(playMusicInfo.musicInfo?.id).toBe('first')
})
it('selected queue stops after its last song instead of resuming the old list', async() => {
  vi.useFakeTimers()
  const selected = onlineSong('last')
  playMusicSelection([selected], 'user-list')
  await playNext(true)
  await vi.runAllTimersAsync()
  expect(playMusicInfo.musicInfo).toBeNull()
  expect(playInfo.playerListId).toBeNull()
  vi.useRealTimers()
})

it('collect/uncollect during a temporary rescue use the original saved identity and pin', () => {
  const original = onlineSong('saved')
  original.meta.toggleMusicInfo = onlineSong('manual')
  original.meta.manualVersionPinned = true
  Object.assign(playMusicInfo, { musicInfo: original, resolvedMusicInfo: onlineSong('rescue') })
  collectMusic()
  expect(addListMusics).toHaveBeenCalledWith(undefined, [original])
  uncollectMusic()
  expect(removeListMusics).toHaveBeenCalledWith({ listId: undefined, ids: ['saved'] })
})

it.each(['local', 'download'])('%s fallback must record actual source and temporary notice while retaining container identity', async(kind) => {
  const base = onlineSong('original')
  const original = kind === 'local'
    ? { ...base, source: 'local', meta: { ...base.meta, filePath: '/missing.mp3', ext: 'mp3' } }
    : { id: 'download-a', progress: {}, metadata: { musicInfo: base } }
  const resolved = onlineSong('rescued')
  playMusicInfo.musicInfo = original as any
  vi.mocked(getMusicUrl).mockImplementationOnce(async({ onResolvedMusicInfo }) => { onResolvedMusicInfo?.(resolved); return 'rescued-url' })
  setMusicUrl(original as any)
  await vi.waitFor(() => { expect(writebackToggleMusicInfo).toHaveBeenCalledWith(original, resolved) })
  expect(playMusicInfo.musicInfo).toBe(original)
})

it('confirming the active chooser preview restores the saved original identity and original temp flag', () => {
  const original = onlineSong('saved-a')
  const preview = onlineSong('preview-b')
  original.meta = { ...original.meta, toggleMusicInfo: preview, manualVersionPinned: true }
  Object.assign(playMusicInfo, { musicInfo: preview, listId: 'playLater', isTempPlay: true })
  const pending = { listId: 'later', musicInfo: onlineSong('queued'), isTempPlay: true }
  tempPlayList.push(pending)
  restartSelectedVersion('love', original, { musicInfo: preview, isTempPlay: false })
  expect(playMusicInfo.musicInfo).toBe(original)
  expect(playMusicInfo.listId).toBe('love')
  expect(playMusicInfo.isTempPlay).toBe(false)
  expect(tempPlayList).toEqual([pending])
})
it('confirming an old chooser after another track starts never interrupts the newer track', () => {
  const current = onlineSong('newer')
  Object.assign(playMusicInfo, { musicInfo: current, listId: 'other', isTempPlay: true })
  restartSelectedVersion('love', onlineSong('a'), { musicInfo: onlineSong('b'), isTempPlay: false })
  expect(playMusicInfo.musicInfo).toBe(current)
})

it('switching from random to sequential ignores old random history when choosing the next song', async() => {
  const tracks = [onlineSong('a'), onlineSong('b'), onlineSong('c')]
  appSetting['player.togglePlayMethod'] = 'list'
  Object.assign(playInfo, { playerListId: 'list', playerPlayIndex: 0 })
  Object.assign(playMusicInfo, { musicInfo: tracks[0], listId: 'list', isTempPlay: false })
  playedList.splice(0, playedList.length, ...[tracks[0], tracks[2], tracks[1]].map(musicInfo => ({ musicInfo, listId: 'list', isTempPlay: false })))
  resetRandomNextMusicInfo()
  vi.mocked(getList).mockReturnValue(tracks)
  vi.mocked(filterList).mockResolvedValue({ filteredList: tracks, playerIndex: 0 })
  expect((await getNextPlayMusicInfo())?.musicInfo.id).toBe('b')
  await playNext(true)
  expect(playMusicInfo.musicInfo?.id).toBe('b')
  playedList.splice(0)
})

it('late artwork and lyrics from the previous version cannot overwrite the same saved ID after reselecting', async() => {
  const original = onlineSong('a')
  const updated = { ...original, meta: { ...original.meta, toggleMusicInfo: onlineSong('b') } }
  let oldPic!: (value: string) => void
  let oldLyric!: (value: any) => void
  vi.mocked(getPicPath).mockImplementationOnce(async() => new Promise(resolve => { oldPic = resolve })).mockResolvedValueOnce('new-cover')
  vi.mocked(getLyricInfo).mockImplementationOnce(async() => new Promise(resolve => { oldLyric = resolve })).mockResolvedValueOnce({ lyric: 'new-lyrics', rawlrcInfo: { lyric: 'new-lyrics' } } as any)
  playMusicInfoNow(original)
  playMusicInfoNow(updated)
  for (let i = 0; i < 15; i++) await Promise.resolve()
  expect(setMusicInfo).toHaveBeenCalledWith({ pic: 'new-cover' })
  vi.mocked(setMusicInfo).mockClear()
  oldPic('old-cover'); oldLyric({ lyric: 'old-lyrics', rawlrcInfo: { lyric: 'old-lyrics' } })
  for (let i = 0; i < 15; i++) await Promise.resolve()
  expect(setMusicInfo).not.toHaveBeenCalled()
})

it('handlePlayerPicError triggers one-shot domestic cover fallback for YTM and discards late result after track switch', async() => {
  const ytmSong: LX.Music.MusicInfoOnline = {
    id: 'ytm_picErr01',
    name: '晴天',
    singer: '周杰伦',
    source: 'ytm',
    interval: '04:29',
    meta: { songId: 'picErr01', albumName: '叶惠美', picUrl: 'https://lh3.googleusercontent.com/blocked.jpg', qualitys: [], _qualitys: {} },
  }
  playMusicInfo.musicInfo = ytmSong
  playMusicInfo.listId = 'temp'
  vi.mocked(setMusicInfo).mockClear()
  vi.mocked(getPicPath).mockClear()
  vi.mocked(getPicPath).mockResolvedValueOnce('https://domestic.cdn/cover.jpg')

  handlePlayerPicError()
  // 同一首曲目第二次触发图片报错不再重复拉取（防死循环）
  handlePlayerPicError()
  for (let i = 0; i < 10; i++) await Promise.resolve()
  expect(getPicPath).toHaveBeenCalledTimes(1)
  expect(getPicPath).toHaveBeenCalledWith(expect.objectContaining({
    musicInfo: ytmSong,
    listId: 'temp',
    isRefresh: true,
  }))
  expect(setMusicInfo).toHaveBeenCalledWith({ pic: 'https://domestic.cdn/cover.jpg' })

  // 切歌后迟到的旧图回落不覆盖新曲封面
  const ytmSong2: LX.Music.MusicInfoOnline = { ...ytmSong, id: 'ytm_picErr02' }
  playMusicInfo.musicInfo = ytmSong2
  let resolveLate!: (url: string) => void
  vi.mocked(getPicPath).mockImplementationOnce(async() => new Promise<string>(resolve => { resolveLate = resolve }))
  vi.mocked(setMusicInfo).mockClear()

  handlePlayerPicError()
  // 触发报错时先同步清空损坏封面，再启动回落
  expect(setMusicInfo).toHaveBeenCalledWith({ pic: null })
  vi.mocked(setMusicInfo).mockClear()
  playMusicInfo.musicInfo = onlineSong('next-track')
  resolveLate('https://stale.cdn/old.jpg')
  for (let i = 0; i < 10; i++) await Promise.resolve()
  expect(setMusicInfo).not.toHaveBeenCalled()
})
