import { beforeEach, expect, it, vi } from 'vitest'
import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { getMusicUrlInfo, getMusicUrl as getStoredUrl } from '@renderer/utils/ipc'
import { getMusicUrl } from '@renderer/core/music/online'
import { getMusicUrl as getDbUrl, musicUrlSave } from '@main/worker/dbService/modules/music_url'

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), fetch: vi.fn(), isDomesticSourceServable: vi.fn(() => true), cache: new Map<string, string>() }))
vi.mock('@main/worker/dbService/modules/music_url/dbHelper', () => ({
  queryMusicUrl: (id: string) => mocks.cache.get(id) ?? null,
  insertMusicUrl: (items: LX.Music.MusicUrlInfo[]) => { for (const { id, url } of items) mocks.cache.set(id, url) },
}))
vi.mock('@common/rendererIpc', () => ({ rendererInvoke: mocks.invoke, rendererSend: vi.fn(), rendererOn: vi.fn(), rendererOff: vi.fn() }))
vi.mock('@common/constants', async(importOriginal) => {
  const actual = await importOriginal<typeof import('@common/constants')>()
  return { ...actual, APP_EVENT_NAMES: {}, DATA_KEYS: {}, DEFAULT_SETTING: {} }
})
vi.mock('@renderer/store/list/action', () => ({ updateListMusics: vi.fn() }))
vi.mock('@renderer/store/setting', () => ({ appSetting: { 'player.playQuality': '128k' } }))
vi.mock('@renderer/core/music/utils', () => ({
  getPlayQuality: () => '128k',
  handleGetOnlineMusicUrl: mocks.fetch,
  isDomesticSourceServable: mocks.isDomesticSourceServable,
}))

const song = (id: string, source: 'kw' | 'wy'): LX.Music.MusicInfoOnline => ({
  id,
  source,
  name: 'Song',
  singer: 'Artist',
  interval: null,
  meta: { songId: id, albumName: '', qualitys: [], _qualitys: {} },
})
const original = song('kw_original', 'kw')
const replacement = song('wy_replacement', 'wy')
const cacheKey = `${original.id}_128k`

beforeEach(() => {
  vi.resetAllMocks()
  mocks.cache.clear()
  mocks.isDomesticSourceServable.mockReturnValue(true)
  mocks.invoke.mockImplementation(async(name, params) => {
    if (name === WIN_MAIN_RENDERER_EVENT_NAME.get_music_url) return getDbUrl(params)
    if (name === WIN_MAIN_RENDERER_EVENT_NAME.save_music_url) {
      // 复用真实数据库序列化，IPC 中使用远端已建立的对象协议。
      expect(typeof params.url).toBe('string')
      musicUrlSave([params])
      return
    }
    throw new Error(`Unexpected IPC: ${name}`)
  })
  mocks.fetch.mockResolvedValue({ url: 'replacement-url', quality: '128k', musicInfo: replacement, isFromCache: false })
})

it('预加载替代资源只缓存实际歌曲，原版下一次仍优先重试', async() => {
  await expect(getMusicUrl({ musicInfo: original, isRefresh: false })).resolves.toBe('replacement-url')
  const onResolvedMusicInfo = vi.fn()
  await expect(getMusicUrl({ musicInfo: original, isRefresh: false, onResolvedMusicInfo })).resolves.toBe('replacement-url')
  expect(mocks.fetch).toHaveBeenCalledTimes(2)
  expect(onResolvedMusicInfo).toHaveBeenCalledExactlyOnceWith(replacement)
  await expect(getMusicUrlInfo(original, '128k')).resolves.toBeNull()
  await expect(getMusicUrlInfo(replacement, '128k')).resolves.toEqual({ id: `${replacement.id}_128k`, url: 'replacement-url', musicInfo: replacement })
})

it('旧 URL 缓存仍可供旧字符串接口读取，但在线播放重新确认来源', async() => {
  mocks.cache.set(cacheKey, 'legacy-url')
  await expect(getStoredUrl(original, '128k')).resolves.toBe('legacy-url')
  const onResolvedMusicInfo = vi.fn()
  await getMusicUrl({ musicInfo: original, isRefresh: false, onResolvedMusicInfo })
  expect(mocks.fetch).toHaveBeenCalledOnce()
  expect(onResolvedMusicInfo).toHaveBeenCalledWith(replacement)
})

it('禁止换源时不使用原条目名下的跨歌曲缓存', async() => {
  mocks.cache.set(cacheKey, JSON.stringify({ url: 'replacement-url', musicInfo: replacement }))
  mocks.fetch.mockResolvedValue({ url: 'original-url', quality: '128k', musicInfo: original, isFromCache: false })
  const onResolvedMusicInfo = vi.fn()
  await expect(getMusicUrl({ musicInfo: original, isRefresh: false, allowToggleSource: false, onResolvedMusicInfo })).resolves.toBe('original-url')
  expect(mocks.fetch).toHaveBeenCalledWith(expect.objectContaining({ allowToggleSource: false }))
  expect(onResolvedMusicInfo).toHaveBeenCalledWith(original)
})

it('刷新覆盖旧来源缓存，后续播放使用新来源', async() => {
  await getMusicUrl({ musicInfo: original, isRefresh: false })
  mocks.fetch.mockResolvedValue({ url: 'recovered-original-url', quality: '128k', musicInfo: original, isFromCache: false })
  await getMusicUrl({ musicInfo: original, isRefresh: true })
  const onResolvedMusicInfo = vi.fn()
  await expect(getMusicUrl({ musicInfo: original, isRefresh: false, onResolvedMusicInfo })).resolves.toBe('recovered-original-url')
  expect(onResolvedMusicInfo).toHaveBeenCalledWith(original)
  expect(mocks.fetch).toHaveBeenCalledTimes(2)
})

it.each(['{"url":', '{"url":12}', '{"url":"cached","musicInfo":{}}'])('损坏缓存不阻断重新取流：%s', async(raw) => {
  mocks.cache.set(cacheKey, raw)
  await expect(getMusicUrl({ musicInfo: original, isRefresh: false })).resolves.toBe('replacement-url')
  expect(mocks.fetch).toHaveBeenCalledOnce()
})

it('缓存写入失败仍能播放已取得的 URL', async() => {
  mocks.invoke.mockRejectedValueOnce(new Error('disk unavailable'))
  const onResolvedMusicInfo = vi.fn()
  // 刷新直接取流，因此这里的失败来自缓存写入。
  await expect(getMusicUrl({ musicInfo: original, isRefresh: true, onResolvedMusicInfo })).resolves.toBe('replacement-url')
  expect(onResolvedMusicInfo).toHaveBeenCalledWith(replacement)
})

it('预加载原版等待持久缓存写入完成，正式播放不会重复取流', async() => {
  mocks.fetch.mockResolvedValue({ url: 'original-url', quality: '128k', musicInfo: original, isFromCache: false })
  let release!: () => void
  const writeGate = new Promise<void>(resolve => { release = resolve })
  const invoke = mocks.invoke.getMockImplementation()!
  mocks.invoke.mockImplementation(async(name, params) => {
    if (name === WIN_MAIN_RENDERER_EVENT_NAME.save_music_url) await writeGate
    return invoke(name, params)
  })
  let loaded = false
  const preload = getMusicUrl({ musicInfo: original, isRefresh: false }).then(() => { loaded = true })
  for (let i = 0; i < 20; i++) await Promise.resolve()
  expect(mocks.fetch).toHaveBeenCalledOnce()
  expect(loaded).toBe(false)
  release()
  await preload
  await getMusicUrl({ musicInfo: original, isRefresh: false })
  expect(mocks.fetch).toHaveBeenCalledOnce()
})

it('YTM 曲目按外层请求音质(128k)写别名缓存，即使国内目标解析为 flac 或命中自身缓存(isFromCache=true)，重播零额外换源', async() => {
  const ytmSong: LX.Music.MusicInfoOnline = {
    id: 'ytm_dQw4w9WgXcQ',
    source: 'ytm',
    name: '晴天',
    singer: '周杰伦',
    interval: '04:29',
    meta: { songId: 'dQw4w9WgXcQ', albumName: '叶惠美', qualitys: [{ type: '128k', size: '' }], _qualitys: { '128k': {} } },
  }
  mocks.fetch.mockResolvedValueOnce({ url: 'wy-flac-url', quality: 'flac', musicInfo: replacement, isFromCache: true })

  const onResolved1 = vi.fn()
  await expect(getMusicUrl({ musicInfo: ytmSong, isRefresh: false, onResolvedMusicInfo: onResolved1 })).resolves.toBe('wy-flac-url')
  expect(onResolved1).toHaveBeenCalledWith(replacement)
  // 别名键按外层 requestedQuality=128k 写入，国内目标未重复覆盖
  await expect(getMusicUrlInfo(ytmSong, '128k')).resolves.toEqual({
    id: `${ytmSong.id}_128k`,
    url: 'wy-flac-url',
    musicInfo: replacement,
  })

  // 二次播放直接命中 YTM 别名缓存（不再次调 handleGetOnlineMusicUrl）
  const onResolved2 = vi.fn()
  await expect(getMusicUrl({ musicInfo: ytmSong, isRefresh: false, onResolvedMusicInfo: onResolved2 })).resolves.toBe('wy-flac-url')
  expect(onResolved2).toHaveBeenCalledWith(replacement)
  expect(mocks.fetch).toHaveBeenCalledOnce()

  // 当目标国内源不再可服务时，不误用失效别名缓存，重新取流
  mocks.isDomesticSourceServable.mockReturnValue(false)
  mocks.fetch.mockResolvedValueOnce({ url: 'kw-fallback-url', quality: '128k', musicInfo: original, isFromCache: false })
  await expect(getMusicUrl({ musicInfo: ytmSong, isRefresh: false })).resolves.toBe('kw-fallback-url')
  expect(mocks.fetch).toHaveBeenCalledTimes(2)
})
