import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from '../../../lang'
import { toNewMusicInfo, toOldMusicInfo } from '@common/utils/tools'
import { createCatalogAdapter } from './adapter'
import { type CatalogTarget } from './types'

beforeEach(() => {
  const i18n = createI18n()
  i18n.setLanguage('zh-cn')
  vi.stubGlobal('window', { i18n })
})
afterEach(() => { vi.unstubAllGlobals() })

const raw = (id = 'song') => ({ name: 'Song', singer: 'Artist', source: 'wy', songmid: id, albumName: 'Album', albumId: 8, types: [], _types: {}, artists: [{ id: 7, name: 'Artist' }] })
const music = () => toNewMusicInfo(raw()) as LX.Music.MusicInfoOnline
const target: CatalogTarget = { kind: 'artist', source: 'wy', id: 7, name: 'Artist' }

describe('ID-based catalog adapter', () => {
  it('preserves provider artist identity through old/new conversion without aliasing', () => {
    const input = raw()
    const converted = toNewMusicInfo(input) as LX.Music.MusicInfoOnline
    expect(converted.meta.artists).toEqual(input.artists)
    converted.meta.artists![0].name = 'Changed'
    expect(input.artists[0].name).toBe('Artist')
    expect(toOldMusicInfo(converted).artists).toEqual([{ id: 7, name: 'Changed' }])
  })
  it('uses saved IDs directly and keeps collaborations as selectable artists', async() => {
    const detail = vi.fn()
    const input = music()
    input.meta.artists!.push({ id: 9, name: 'Collaborator' }, { id: 7, name: 'Duplicate' })
    const adapter = createCatalogAdapter({ wy: { artist: vi.fn(), detail } })
    expect(await adapter.resolve('artist', input)).toEqual([target, { ...target, id: 9, name: 'Collaborator' }])
    expect(detail).not.toHaveBeenCalled()
  })
  it('resolves missing identity only through exact song detail', async() => {
    const input = music()
    delete input.meta.artists
    const detail = vi.fn(async() => ({ artists: [{ id: 7, name: 'Artist' }] }))
    const adapter = createCatalogAdapter({ wy: { artist: vi.fn(), detail } })
    expect(await adapter.resolve('artist', input)).toEqual([target])
    expect(detail).toHaveBeenCalledWith(input)
    expect(input.meta.artists).toBeUndefined()
  })
  it('reports missing IDs and unsupported catalog kinds instead of searching', async() => {
    const input = music()
    input.meta.artists = [{ id: 0, name: 'Unknown' }]
    const adapter = createCatalogAdapter({ wy: { artist: vi.fn(), detail: async() => null } })
    await expect(adapter.resolve('artist', input)).rejects.toMatchObject({ code: 'metadata' })
    await expect(adapter.resolve('album', input)).rejects.toMatchObject({ code: 'not-integrated' })
  })
  it('resolves an album by its provider ID even for a compilation', async() => {
    const input = { ...music(), source: 'kw' as const }
    const adapter = createCatalogAdapter({ kw: { album: vi.fn() } })
    expect(await adapter.resolve('album', input)).toEqual([{ kind: 'album', source: 'kw', id: 8, name: 'Album' }])
  })
  it('passes 1-based pagination and preserves provider totals', async() => {
    const fetch = vi.fn(async() => ({ list: [raw()], total: '150', limit: 50 }))
    const adapter = createCatalogAdapter({ wy: { artist: fetch } })
    expect(await adapter.load(target, 2, 50)).toMatchObject({ page: 2, limit: 50, total: 150, hasMore: true })
    expect(fetch).toHaveBeenCalledWith(7, 2, 50)
    expect(await adapter.load(target, 3, 50)).toMatchObject({ hasMore: false })
  })
  it('does not mistake Migu album total for page size or shrink the last-page stride', async() => {
    const fetch = vi.fn().mockResolvedValueOnce({ list: [raw('1'), raw('2')], total: 5, limit: 5 }).mockResolvedValueOnce({ list: [raw('5')], total: 5, limit: 5 })
    const adapter = createCatalogAdapter({ mg: { album: fetch, albumPageSize: 'response-length' } })
    const album: CatalogTarget = { kind: 'album', source: 'mg', id: 8, name: 'Album' }
    expect(await adapter.load(album)).toMatchObject({ limit: 2, hasMore: true })
    expect(await adapter.load(album, 3, 2)).toMatchObject({ limit: 2, hasMore: false })
  })
  it('keeps loading partial pages when the provider omits total, stopping only on an empty response', async() => {
    const fetch = vi.fn().mockResolvedValueOnce({ list: [raw()], limit: 50 }).mockResolvedValueOnce({ list: [], limit: 50 })
    const adapter = createCatalogAdapter({ wy: { artist: fetch } })
    expect(await adapter.load(target, 1)).toMatchObject({ total: null, hasMore: true })
    expect(await adapter.load(target, 2)).toMatchObject({ total: null, hasMore: false })
  })
  it('keeps retryable pagination open for an empty page before the reported total', async() => {
    const adapter = createCatalogAdapter({ wy: { artist: async() => ({ list: [], total: 150, limit: 50 }) } })
    expect(await adapter.load(target, 2)).toMatchObject({ total: 150, hasMore: true })
  })
  it('rejects malformed responses and invalid page arguments', async() => {
    const adapter = createCatalogAdapter({ wy: { artist: vi.fn(async() => ({ list: undefined as any })) } })
    await expect(adapter.load(target)).rejects.toMatchObject({ code: 'response' })
    await expect(adapter.load(target, 0)).rejects.toMatchObject({ code: 'metadata' })
  })
})


describe('catalog error localization', () => {
  it('uses the current locale for provider and metadata errors', async() => {
    window.i18n.setLanguage('en-us')
    const adapter = createCatalogAdapter({ wy: { artist: vi.fn() } })
    await expect(adapter.resolve('album', music())).rejects.toMatchObject({ message: 'Album catalog integration is not implemented for provider NetEase Cloud Music' })
    const input = music()
    delete input.meta.artists
    await expect(adapter.resolve('artist', input)).rejects.toMatchObject({ message: 'Song details do not include an exact artist ID, so the full catalog cannot be opened' })
  })
})
