import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from '../../../lang'
import { createCatalogController, createCatalogState } from './controller'
import { type CatalogPage, type CatalogTarget } from './types'
beforeEach(() => {
  const i18n = createI18n()
  i18n.setLanguage('zh-cn')
  vi.stubGlobal('window', { i18n })
})
afterEach(() => { vi.unstubAllGlobals() })

const song = (id: string): LX.Music.MusicInfoOnline => ({ id, source: 'wy', name: id, singer: 'Artist', interval: null, meta: { songId: id, albumName: 'Album', qualitys: [], _qualitys: {} } })
const target: CatalogTarget = { kind: 'artist', source: 'wy', id: 7, name: 'Artist' }
const page = (id: string, num = 1, more = false): CatalogPage => ({ list: [song(id)], page: num, limit: 1, total: 2, hasMore: more })
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((_resolve, _reject) => { resolve = _resolve; reject = _reject })
  return { promise, resolve, reject }
}
describe('catalog request lifecycle', () => {
  it('keeps songs on a failed next page and retries that exact page', async() => {
    const load = vi.fn().mockResolvedValueOnce(page('a', 1, true)).mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce(page('b', 2))
    const state = createCatalogState()
    const controller = createCatalogController(state, { resolve: async() => [target], load })
    await controller.open('artist', song('origin'))
    await controller.loadMore()
    expect(state.error).toContain('重试')
    expect(state.list.map(s => s.id)).toEqual(['a'])
    expect(state.page).toBe(1)
    await controller.retry()
    expect(load.mock.calls[2]).toEqual([target, 2, 1])
    expect(state.list.map(s => s.id)).toEqual(['a', 'b'])
    expect(state.hasMore).toBe(false)
  })
  it('ignores a response after close', async() => {
    const pending = deferred<CatalogPage>()
    const state = createCatalogState()
    const controller = createCatalogController(state, { resolve: async() => [target], load: async() => pending.promise })
    const opened = controller.open('artist', song('origin'))
    await Promise.resolve()
    controller.close()
    pending.resolve(page('late'))
    await opened
    expect(state.show).toBe(false)
    expect(state.list).toEqual([])
  })
  it('ignores an older detail response after a newer catalog is opened', async() => {
    const pending = deferred<CatalogTarget[]>()
    const resolve = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce([{ ...target, id: 8, name: 'New artist' }])
    const state = createCatalogState()
    const controller = createCatalogController(state, { resolve, load: async() => page('new') })
    const old = controller.open('artist', song('old'))
    await controller.open('artist', song('new'))
    pending.resolve([target])
    await old
    expect(state.target?.id).toBe(8)
    expect(state.list[0].id).toBe('new')
  })
  it('requires a choice for collaborations and suppresses duplicate load-more clicks', async() => {
    const pending = deferred<CatalogPage>()
    const load = vi.fn(async() => pending.promise)
    const state = createCatalogState()
    const controller = createCatalogController(state, { resolve: async() => [target, { ...target, id: 8 }], load })
    await controller.open('artist', song('origin'))
    expect(load).not.toHaveBeenCalled()
    const chosen = controller.select(target)
    await controller.loadMore()
    expect(load).toHaveBeenCalledTimes(1)
    pending.resolve(page('a'))
    await chosen
  })
  it('surfaces repeated provider pages rather than claiming a complete catalog', async() => {
    const state = createCatalogState()
    const controller = createCatalogController(state, { resolve: async() => [target], load: async() => page('a', 1, true) })
    await controller.open('artist', song('origin'))
    await controller.loadMore()
    expect(state.error).toContain('未返回新的')
    expect(state.hasMore).toBe(true)
    expect(state.page).toBe(1)
  })
})


describe('catalog state localization', () => {
  it('uses the current locale for titles and retry errors', async() => {
    window.i18n.setLanguage('en-us')
    const state = createCatalogState()
    const controller = createCatalogController(state, { resolve: async() => [target], load: async() => { throw Error('offline') } })
    await controller.open('artist', song('origin'))
    expect(state.title).toBe('Artist · Artist songs · NetEase Cloud Music')
    expect(state.error).toBe('Catalog request failed (network or provider error). Please retry')
  })

  it('openTarget opens a known artist/album directly without needing a seed song', async() => {
    const state = createCatalogState()
    const load = vi.fn().mockResolvedValueOnce(page('direct-1', 1, false))
    const controller = createCatalogController(state, { resolve: vi.fn(), load })
    await controller.openTarget(target)
    expect(state.show).toBe(true)
    expect(state.target).toEqual(target)
    expect(state.list.map(s => s.id)).toEqual(['direct-1'])
  })
})
