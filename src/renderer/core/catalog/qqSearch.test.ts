import { beforeEach, expect, it, vi } from 'vitest'
import search from '@renderer/utils/musicSdk/tx/musicSearch'
const mocks = vi.hoisted(() => ({ sign: vi.fn() }))
vi.mock('@renderer/utils/musicSdk/tx/utils', () => ({ signRequest: mocks.sign }))
vi.mock('@renderer/utils/index', () => ({ formatPlayTime: String, sizeFormate: String }))
beforeEach(() => { vi.clearAllMocks() })
it('QQ rejects a provider refusal once without blindly repeating it six times and appends diagnostic code', async() => {
  mocks.sign.mockResolvedValue({ body: { code: 0, req: { code: 1000 } } })
  await expect(search.search('query')).rejects.toThrow('搜索失败 (code=0/1000)')
  expect(mocks.sign).toHaveBeenCalledTimes(1)
})
it('QQ identifies a successful malformed payload as a response-format error', async() => {
  mocks.sign.mockResolvedValue({ body: { code: 0, req: { code: 0, data: {} } } })
  await expect(search.search('query')).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
})
it('QQ preserves transport errors without a blind automatic retry', async() => {
  mocks.sign.mockRejectedValue(new Error('temporary network failure'))
  await expect(search.search('query')).rejects.toThrow('temporary network failure')
  expect(mocks.sign).toHaveBeenCalledTimes(1)
})
it('QQ accepts a valid empty result', async() => {
  mocks.sign.mockResolvedValue({ body: { code: 0, req: { code: 0, data: { body: { song: { list: [] } }, meta: { sum: 0 } } } } })
  await expect(search.search('query')).resolves.toMatchObject({ list: [], total: 0 })
})
it('QQ cancellation suppresses a late valid response', async() => {
  let resolve!: (value: unknown) => void
  const request = Object.assign(new Promise(_resolve => { resolve = _resolve }), { cancel: vi.fn() })
  mocks.sign.mockReturnValue(request)
  const pending = search.search('query')
  if (!('cancel' in pending) || typeof pending.cancel !== 'function') throw new Error('Missing cancellation contract')
  pending.cancel()
  resolve({ body: { code: 0, req: { code: 0, data: { body: { song: { list: [] } }, meta: { sum: 0 } } } } })
  await expect(pending).rejects.toThrow('request cancelled')
  expect(request.cancel).toHaveBeenCalledOnce()
})

it('QQ playlist search rejects provider refusal without six identical retries', async() => {
  const { httpFetch } = await import('@renderer/utils/request')
  vi.mocked(httpFetch).mockReturnValue({ promise: Promise.resolve({ body: { code: 1000 } }) } as any)
  const { default: playlists } = await import('@renderer/utils/musicSdk/tx/songList')
  await expect(playlists.search('query', 1)).rejects.toThrow()
  expect(httpFetch).toHaveBeenCalledOnce()
})
vi.mock('@renderer/utils/request', () => ({ httpFetch: vi.fn() }))
it.each([{ code: 0, data: {} }, { code: 0, data: { list: [], sum: 'bad' } }])('QQ playlist successful malformed payload is a schema error: %j', async(body) => {
  const { httpFetch } = await import('@renderer/utils/request')
  vi.mocked(httpFetch).mockReturnValue({ promise: Promise.resolve({ body }) } as any)
  const { default: playlists } = await import('@renderer/utils/musicSdk/tx/songList')
  await expect(playlists.search('query', 1)).rejects.toMatchObject({ name: 'MusicSdkResponseError' })
})
it('QQ playlist valid empty response remains successful', async() => {
  const { httpFetch } = await import('@renderer/utils/request')
  vi.mocked(httpFetch).mockReturnValue({ promise: Promise.resolve({ body: { code: 0, data: { list: [], sum: 0 } } }) } as any)
  const { default: playlists } = await import('@renderer/utils/musicSdk/tx/songList')
  await expect(playlists.search('query', 1)).resolves.toMatchObject({ list: [], total: 0 })
})
