import { MusicSdkResponseError } from '@renderer/utils/musicSdk/responseError'
import { toNewMusicInfo } from '@common/utils/tools'
import { type CatalogKind, type CatalogPage, type CatalogProviders, type CatalogTarget } from './types'

export const getCatalogSourceLabel = (source: LX.OnlineSource): string => {
  const prefix = window.lxData?.appSetting?.['common.sourceNameType'] === 'alias' ? 'source_alias_' : 'source_'
  const key = `${prefix}${source}` as Parameters<typeof window.i18n.t>[0]
  const translated = window.i18n.t(key)
  return translated && translated !== key ? translated : source
}

export class CatalogError extends Error {
  constructor(public readonly code: 'unsupported' | 'not-integrated' | 'metadata' | 'response', message: string) {
    super(message)
  }
}
const validId = (id: unknown): id is string | number =>
  (typeof id === 'string' && id.trim() !== '' && id !== '0') || (typeof id === 'number' && Number.isFinite(id) && id > 0)

export const createCatalogAdapter = (providers: CatalogProviders) => ({
  async resolve(kind: CatalogKind, music: LX.Music.MusicInfo): Promise<CatalogTarget[]> {
    if (music.source === 'local') throw new CatalogError('unsupported', window.i18n.t('catalog__local'))
    if (!providers[music.source]?.[kind]) {
      throw new CatalogError('not-integrated', window.i18n.t(kind === 'artist' ? 'catalog__unsupported_artist' : 'catalog__unsupported_album', { source: getCatalogSourceLabel(music.source) }))
    }
    const provider = providers[music.source]!
    let metadata = music.meta
    const needsDetail = kind === 'artist'
      ? !metadata.artists?.some(artist => validId(artist.id) && artist.name)
      : !validId(metadata.albumId)
    if (needsDetail && provider.detail) {
      const detail = await provider.detail(music)
      if (detail) metadata = { ...metadata, ...detail }
    }
    if (kind === 'album') {
      if (!validId(metadata.albumId)) throw new CatalogError('metadata', window.i18n.t('catalog__missing_album_id'))
      return [{ kind, source: music.source, id: metadata.albumId, name: metadata.albumName || music.meta.albumName || window.i18n.t('catalog__album') }]
    }
    const seen = new Set<string>()
    const artists = metadata.artists?.filter(artist => {
      if (!validId(artist.id) || !artist.name || seen.has(String(artist.id))) return false
      seen.add(String(artist.id))
      return true
    }) ?? []
    if (!artists.length) throw new CatalogError('metadata', window.i18n.t('catalog__missing_artist_id'))
    return artists.map(artist => ({ kind, source: music.source, id: artist.id, name: artist.name }))
  },

  async load(target: CatalogTarget, page = 1, limit = 50): Promise<CatalogPage> {
    const provider = providers[target.source]
    const fetchPage = provider?.[target.kind]
    if (!fetchPage) throw new CatalogError('not-integrated', window.i18n.t('catalog__unsupported'))
    if (!validId(target.id) || !Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
      throw new CatalogError('metadata', window.i18n.t('catalog__invalid_parameters'))
    }
    let result
    try {
      result = await fetchPage(target.id, page, limit)
    } catch (error) {
      if (error instanceof MusicSdkResponseError) throw new CatalogError('response', window.i18n.t('catalog__invalid_response'))
      throw error
    }
    if (!Array.isArray(result?.list)) throw new CatalogError('response', window.i18n.t('catalog__invalid_response'))
    const totalValue = result.total == null ? NaN : Number(result.total)
    const total = Number.isFinite(totalValue) && totalValue >= 0 ? totalValue : null
    const responseLimit = Number(result.limit)
    // Migu's legacy SDK reports the album total as the page size. Infer only on page 1.
    const pageSize = target.kind === 'album' && provider?.albumPageSize === 'response-length'
      ? (page === 1 ? result.list.length || limit : limit)
      : Number.isFinite(responseLimit) && responseLimit > 0 ? responseLimit : limit
    const list = result.list.map(raw => toNewMusicInfo(raw) as LX.Music.MusicInfoOnline)
    return {
      list,
      page,
      limit: pageSize,
      total,
      hasMore: total === null ? result.list.length > 0 : page * pageSize < total,
    }
  },
})
