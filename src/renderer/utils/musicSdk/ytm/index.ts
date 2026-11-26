/**
 * YouTube Music 一等在线音源 SDK（与 QQ音乐 / 网易云音乐完全平权）：
 * 接入搜索（歌曲 / 歌手 / 专辑 / 歌单）、热搜与搜索联想、歌单页（标签 / 列表 / 详情 / 链接导入）、
 * 排行榜（地区 + 全球官方榜单）、歌手/专辑目录、相似歌曲、以及原生音频直链播放 / 下载 / 歌词 / 封面。
 */

import { YTM_REQUEST_TIMEOUT_MS } from '@common/recommendationConfig'
import { MusicSdkResponseError } from '@renderer/utils/musicSdk/responseError'
import {
  attachCancel,
  markYtmContextReachable,
  postInnerTube,
  resolveLiveYtmProxy,
  YTM_SEARCH_PARAMS,
  type LiveYtmProxyContext,
} from './client'
import {
  normalizeYtmPlaylistId,
  parseYtmAlbumDetail,
  parseYtmArtistPage,
  parseYtmBrowsePlaylists,
  parseYtmCharts,
  parseYtmHotSearchTerms,
  parseYtmMoodsAndGenres,
  parseYtmPlaylistDetailPage,
  parseYtmNextRadio,
  parseYtmSearchAlbumsPage,
  parseYtmSearchArtistsPage,
  parseYtmSearchPlaylistsPage,
  parseYtmSearchSongsPage,
  parseYtmSearchSuggestions,
  toLegacyYtmSong,
  type YtmBoardItem,
  type YtmCatalogAlbumItem,
  type YtmCatalogArtistItem,
  type YtmLegacySongRow,
  type YtmPlaylistDetailInfo,
  type YtmPlaylistItem,
  type YtmRawTrack,
} from './parser'
import {
  sharedYtmPaginationCache,
  type StreamFetchResult,
  type StreamWindowResult,
  type YtmCancellablePromise,
} from './paginationCache'
import { getYtmMusicUrl, getYtmTrackPic, type YtmMusicUrlOptions } from './player'
import { getYtmLyric } from './lyric'

const toPositiveInt = (val: unknown, fallback: number): number => {
  const n = Number(val)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

const clonePlaylistItem = (item: YtmPlaylistItem): YtmPlaylistItem => ({ ...item })
const cloneArtistItem = (item: YtmCatalogArtistItem): YtmCatalogArtistItem => ({ ...item })
const cloneAlbumItem = (item: YtmCatalogAlbumItem): YtmCatalogAlbumItem => ({ ...item })

const fetchSearchPage = <T>(
  kind: string,
  query: string,
  params: string,
  page: number,
  limit: number,
  parser: (body: unknown) => { items: T[], continuation: string | null, hasValidContainer: boolean },
  getItemId: (item: T) => string,
  ctx: LiveYtmProxyContext = resolveLiveYtmProxy(),
): YtmCancellablePromise<StreamWindowResult<T>> => {
  const normalizedQuery = String(query ?? '').trim()
  const key = `${ctx.contextKey}::search:${kind}::${normalizedQuery}`
  return sharedYtmPaginationCache.fetchWindow<T>({
    key,
    page,
    limit,
    getItemId,
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    fetcher: (cursor) => {
      const payload = cursor.isInitial
        ? { query: normalizedQuery, params }
        : { continuation: cursor.continuation }
      const req = postInnerTube('search', payload, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
      return attachCancel(
        req.then(body => {
          const parsed = parser(body)
          if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
          if (parsed.items.length) markYtmContextReachable(ctx.contextKey)
          return {
            items: parsed.items,
            continuation: parsed.continuation,
          }
        }),
        () => req.cancel?.(),
      )
    },
  })
}

const fetchChartsPlaylists = (ctx: LiveYtmProxyContext): YtmCancellablePromise<{ items: YtmPlaylistItem[], partial: boolean }> => {
  const localReq = postInnerTube('browse', { browseId: 'FEmusic_charts' }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
  const globalReq = postInnerTube('browse', { browseId: 'FEmusic_charts', formData: { selectedValues: ['ZZ'] } }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
  localReq.catch(() => {})
  globalReq.catch(() => {})
  let cancelled = false

  const promise = Promise.allSettled([localReq, globalReq]).then(results => {
    if (cancelled) throw new Error('request cancelled')
    const merged: YtmPlaylistItem[] = []
    const seen = new Set<string>()
    let validCount = 0
    let firstError: unknown = null

    for (const r of results) {
      if (r.status === 'rejected') {
        firstError ??= r.reason
        continue
      }
      const parsed = parseYtmBrowsePlaylists(r.value)
      if (!parsed.hasValidContainer) {
        firstError ??= new MusicSdkResponseError()
        continue
      }
      validCount++
      for (const item of parsed.list) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        merged.push(item)
      }
    }
    if (!validCount) throw firstError ?? new MusicSdkResponseError()
    if (merged.length) markYtmContextReachable(ctx.contextKey)
    return { items: merged, partial: validCount < results.length }
  })

  return attachCancel(promise, () => {
    cancelled = true
    localReq.cancel?.()
    globalReq.cancel?.()
  })
}

export interface YtmPlaylistDetailFetchOptions {
  expectedGeneration?: number
  ctx?: LiveYtmProxyContext
}

const fetchPlaylistDetailWindow = (
  rawId: string,
  page = 1,
  limit = 50,
  isRefresh = false,
  options?: YtmPlaylistDetailFetchOptions,
): YtmCancellablePromise<{
  list: YtmLegacySongRow[]
  page: number
  limit: number
  total: number
  allPage: number
  hasMore: boolean
  truncated: boolean
  generation: number
  source: 'ytm'
  info: YtmPlaylistDetailInfo
}> => {
  const ctx = options?.ctx ?? resolveLiveYtmProxy()
  const canonicalId = normalizeYtmPlaylistId(rawId)
  if (!canonicalId) {
    return attachCancel(Promise.reject(new Error('无效或不支持的 YouTube Music 歌单 ID')), () => {})
  }
  const safePage = toPositiveInt(page, 1)
  const safeLimit = toPositiveInt(limit, 50)
  const key = `${ctx.contextKey}::playlist:detail::${canonicalId}`

  const req = sharedYtmPaginationCache.fetchWindow<YtmRawTrack, YtmPlaylistDetailInfo>({
    key,
    page: safePage,
    limit: safeLimit,
    isRefresh,
    expectedGeneration: options?.expectedGeneration,
    getItemId: track => track.videoId,
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    fetcher: (cursor) => {
      const payload = cursor.isInitial
        ? { browseId: canonicalId }
        : { continuation: cursor.continuation }
      const httpReq = postInnerTube('browse', payload, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
      return attachCancel(
        httpReq.then(body => {
          const parsed = parseYtmPlaylistDetailPage(body)
          if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
          if (parsed.tracks.length) markYtmContextReachable(ctx.contextKey)
          return {
            items: parsed.tracks,
            continuation: parsed.continuation,
            meta: cursor.isInitial ? parsed.info : undefined,
          }
        }),
        () => httpReq.cancel?.(),
      )
    },
  })

  return attachCancel(
    req.then(win => ({
      list: win.list.map(toLegacyYtmSong),
      page: safePage,
      limit: win.limit,
      total: win.total,
      allPage: win.allPage,
      hasMore: win.hasMore,
      truncated: win.truncated,
      generation: win.generation,
      source: 'ytm' as const,
      info: {
        name: win.meta?.name ?? '',
        img: win.meta?.img ?? '',
        desc: win.meta?.desc ?? '',
        author: win.meta?.author ?? 'YouTube Music',
        play_count: win.meta?.play_count ?? '',
      },
    })),
    () => req.cancel?.(),
  )
}

export const musicSearch = {
  limit: 20,
  search(str: string, page = 1, limit = 20): YtmCancellablePromise<{
    list: YtmLegacySongRow[]
    allPage: number
    limit: number
    total: number
    source: 'ytm'
    hasMore: boolean
    truncated: boolean
  }> {
    const safePage = toPositiveInt(page, 1)
    // InnerTube 单次搜索通常返回 ~20 首；将窗口页宽收敛在 this.limit(20) 以内，避免聚合搜索传 30 迫使首屏发 2 次串行 HTTP 撞 4s 软超时
    const safeLimit = Math.min(toPositiveInt(limit, this.limit), this.limit)
    const req = fetchSearchPage<YtmRawTrack>(
      'songs',
      str,
      YTM_SEARCH_PARAMS.songs,
      safePage,
      safeLimit,
      (body) => {
        const parsed = parseYtmSearchSongsPage(body)
        return { items: parsed.tracks, continuation: parsed.continuation, hasValidContainer: parsed.hasValidContainer }
      },
      track => track.videoId,
    )
    return attachCancel(
      req.then(win => ({
        list: win.list.map(toLegacyYtmSong),
        allPage: win.allPage,
        limit: win.limit,
        total: win.total,
        source: 'ytm' as const,
        hasMore: win.hasMore,
        truncated: win.truncated,
      })),
      () => req.cancel?.(),
    )
  },
}

export const singer = {
  limit: 20,
  search(str: string, page = 1, limit = 20): YtmCancellablePromise<{
    list: YtmCatalogArtistItem[]
    limit: number
    total: number
    source: 'ytm'
    hasMore: boolean
  }> {
    const safePage = toPositiveInt(page, 1)
    // InnerTube 单次搜索通常返回 ~20 首；将窗口页宽收敛在 this.limit(20) 以内，避免聚合搜索传 30 迫使首屏发 2 次串行 HTTP 撞 4s 软超时
    const safeLimit = Math.min(toPositiveInt(limit, this.limit), this.limit)
    const req = fetchSearchPage<YtmCatalogArtistItem>(
      'artists',
      str,
      YTM_SEARCH_PARAMS.artists,
      safePage,
      safeLimit,
      (body) => {
        const parsed = parseYtmSearchArtistsPage(body)
        return { items: parsed.list, continuation: parsed.continuation, hasValidContainer: parsed.hasValidContainer }
      },
      item => item.id,
    )
    return attachCancel(
      req.then(win => ({
        list: win.list.map(cloneArtistItem),
        limit: win.limit,
        total: win.total,
        source: 'ytm' as const,
        hasMore: win.hasMore,
      })),
      () => req.cancel?.(),
    )
  },

  getSongList(id: string | number, page = 1, limit = 50): YtmCancellablePromise<{
    list: YtmLegacySongRow[]
    total: number
    limit: number
    source: 'ytm'
    hasMore: boolean
  }> {
    const browseId = String(id ?? '').trim()
    if (!browseId) return attachCancel(Promise.reject(new Error('invalid artist id')), () => {})
    const safePage = toPositiveInt(page, 1)
    const safeLimit = toPositiveInt(limit, 50)
    const ctx = resolveLiveYtmProxy()
    const key = `${ctx.contextKey}::artist:songs::${browseId}`

    const req = sharedYtmPaginationCache.fetchWindow<YtmRawTrack>({
      key,
      page: safePage,
      limit: safeLimit,
      getItemId: track => track.videoId,
      // eslint-disable-next-line @typescript-eslint/promise-function-async
      fetcher: (cursor) => {
        if (!cursor.isInitial) {
          const contReq = postInnerTube('browse', { continuation: cursor.continuation }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
          return attachCancel(
            contReq.then(body => {
              const parsed = parseYtmPlaylistDetailPage(body, { allowGenericShelf: true })
              if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
              if (parsed.tracks.length) markYtmContextReachable(ctx.contextKey)
              return { items: parsed.tracks, continuation: parsed.continuation }
            }),
            () => contReq.cancel?.(),
          )
        }
        let cancelled = false
        const activeReq: { current: YtmCancellablePromise<any> | null } = { current: null }
        const p = (async(): Promise<StreamFetchResult<YtmRawTrack>> => {
          const firstReq = postInnerTube('browse', { browseId }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
          activeReq.current = firstReq
          const artistBody = await firstReq
          if (cancelled) throw new Error('request cancelled')
          const artistPage = parseYtmArtistPage(artistBody, browseId)
          if (!artistPage.hasValidContainer) throw new MusicSdkResponseError()
          if (artistPage.inlineTracks.length) markYtmContextReachable(ctx.contextKey)
          if (artistPage.topSongsBrowseId) {
            try {
              const plPayload: Record<string, unknown> = { browseId: artistPage.topSongsBrowseId }
              if (artistPage.topSongsParams) plPayload.params = artistPage.topSongsParams
              const topReq = postInnerTube('browse', plPayload, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
              activeReq.current = topReq
              const plBody = await topReq
              if (cancelled) throw new Error('request cancelled')
              const plParsed = parseYtmPlaylistDetailPage(plBody, { allowGenericShelf: true })
              if (!plParsed.hasValidContainer) throw new MusicSdkResponseError()
              if (plParsed.tracks.length) markYtmContextReachable(ctx.contextKey)
              if (plParsed.tracks.length || plParsed.continuation) {
                return { items: plParsed.tracks, continuation: plParsed.continuation }
              }
              if (artistPage.inlineTracks.length) {
                return { items: artistPage.inlineTracks, continuation: null, ephemeral: true }
              }
              return { items: [], continuation: null }
            } catch (err) {
              if (cancelled || (err instanceof Error && /cancel/i.test(err.message))) throw err
              // 完整热门歌曲歌单拉取失败或返回无效容器时平滑展示主页内联预览，标记 ephemeral=true 不写入长缓存；
              // 不在此处回写可达态，避免覆盖 topSongs 刚写入的地区受限缓存
              if (artistPage.inlineTracks.length) {
                return { items: artistPage.inlineTracks, continuation: null, ephemeral: true }
              }
              throw err
            }
          }
          return { items: artistPage.inlineTracks, continuation: null }
        })()
        return attachCancel(p, () => {
          cancelled = true
          activeReq.current?.cancel?.()
        })
      },
    })

    return attachCancel(
      req.then(win => ({
        list: win.list.map(toLegacyYtmSong),
        total: win.total,
        limit: win.limit,
        source: 'ytm' as const,
        hasMore: win.hasMore,
      })),
      () => req.cancel?.(),
    )
  },
}

export const album = {
  limit: 20,
  search(str: string, page = 1, limit = 20): YtmCancellablePromise<{
    list: YtmCatalogAlbumItem[]
    limit: number
    total: number
    source: 'ytm'
    hasMore: boolean
  }> {
    const safePage = toPositiveInt(page, 1)
    // InnerTube 单次搜索通常返回 ~20 首；将窗口页宽收敛在 this.limit(20) 以内，避免聚合搜索传 30 迫使首屏发 2 次串行 HTTP 撞 4s 软超时
    const safeLimit = Math.min(toPositiveInt(limit, this.limit), this.limit)
    const req = fetchSearchPage<YtmCatalogAlbumItem>(
      'albums',
      str,
      YTM_SEARCH_PARAMS.albums,
      safePage,
      safeLimit,
      (body) => {
        const parsed = parseYtmSearchAlbumsPage(body)
        return { items: parsed.list, continuation: parsed.continuation, hasValidContainer: parsed.hasValidContainer }
      },
      item => item.id,
    )
    return attachCancel(
      req.then(win => ({
        list: win.list.map(cloneAlbumItem),
        limit: win.limit,
        total: win.total,
        source: 'ytm' as const,
        hasMore: win.hasMore,
      })),
      () => req.cancel?.(),
    )
  },

  getAlbumDetail(id: string | number, page = 1, limit = 50): YtmCancellablePromise<{
    list: YtmLegacySongRow[]
    total: number
    limit: number
    source: 'ytm'
    hasMore: boolean
  }> {
    const browseId = String(id ?? '').trim()
    if (!browseId) return attachCancel(Promise.reject(new Error('invalid album id')), () => {})
    const safePage = toPositiveInt(page, 1)
    const safeLimit = toPositiveInt(limit, 50)
    const ctx = resolveLiveYtmProxy()
    const key = `${ctx.contextKey}::album:songs::${browseId}`

    type AlbumHeaderMeta = ReturnType<typeof parseYtmAlbumDetail>['info']

    const req = sharedYtmPaginationCache.fetchWindow<YtmRawTrack, AlbumHeaderMeta>({
      key,
      page: safePage,
      limit: safeLimit,
      getItemId: track => track.videoId,
      // eslint-disable-next-line @typescript-eslint/promise-function-async
      fetcher: (cursor) => {
        const payload = cursor.isInitial
          ? { browseId }
          : { continuation: cursor.continuation }
        const httpReq = postInnerTube('browse', payload, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
        return attachCancel(
          httpReq.then(body => {
            const parsed = parseYtmAlbumDetail(body, browseId)
            if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
            if (parsed.tracks.length) markYtmContextReachable(ctx.contextKey)
            if (cursor.isInitial) {
              return { items: parsed.tracks, continuation: parsed.continuation, meta: parsed.info }
            }
            // 专辑续页通过 stream.meta 跨页沿用首包头部的艺人/专辑名/封面回填缺失栏位
            const header = cursor.meta
            const filledTracks = header
              ? parsed.tracks.map(t => {
                const resolvedAlbumId = (t.albumId ?? '') || browseId
                const resolvedPicUrl = (t.picUrl ?? '') || header.img
                return {
                  ...t,
                  artist: t.artist || header.artist,
                  artists: t.artists?.length ? t.artists : (!t.artist && header.artists.length ? header.artists : undefined),
                  album: t.album || header.name,
                  albumId: resolvedAlbumId.length > 0 ? resolvedAlbumId : undefined,
                  picUrl: resolvedPicUrl.length > 0 ? resolvedPicUrl : null,
                }
              })
              : parsed.tracks
            return { items: filledTracks, continuation: parsed.continuation }
          }),
          () => httpReq.cancel?.(),
        )
      },
    })

    return attachCancel(
      req.then(win => ({
        list: win.list.map(toLegacyYtmSong),
        total: win.total,
        limit: win.limit,
        source: 'ytm' as const,
        hasMore: win.hasMore,
      })),
      () => req.cancel?.(),
    )
  },
}

export const songList = {
  limit_list: 30,
  limit_song: 50,
  sortList: [
    { name: '推荐', id: 'featured' },
    { name: '排行榜', id: 'charts' },
  ],

  getTags(): YtmCancellablePromise<{
    tags: ReturnType<typeof parseYtmMoodsAndGenres>['tags']
    hotTag: ReturnType<typeof parseYtmMoodsAndGenres>['hotTag']
    source: 'ytm'
  }> {
    const ctx = resolveLiveYtmProxy()
    const req = postInnerTube('browse', { browseId: 'FEmusic_moods_and_genres' }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
    return attachCancel(
      req.then(body => {
        const parsed = parseYtmMoodsAndGenres(body)
        if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
        if (parsed.tags.length) markYtmContextReachable(ctx.contextKey)
        return {
          tags: parsed.tags,
          hotTag: parsed.hotTag,
          source: 'ytm' as const,
        }
      }),
      () => req.cancel?.(),
    )
  },

  getList(sortId: string, tagId: string, page = 1, isRefresh = false): YtmCancellablePromise<{
    list: YtmPlaylistItem[]
    total: number
    page: number
    limit: number
    source: 'ytm'
    partial?: boolean
  }> {
    const safePage = toPositiveInt(page, 1)
    const safeSort = sortId || 'featured'
    const safeTag = String(tagId ?? '').trim()
    // 排行榜排序优先于残留心情/流派标签，确保切换至“排行榜”始终请求 FEmusic_charts
    const effectiveTag = safeSort === 'charts' ? '' : safeTag
    const ctx = resolveLiveYtmProxy()
    const key = `${ctx.contextKey}::songlist:browse::${safeSort}::${effectiveTag}`

    const req = sharedYtmPaginationCache.fetchWindow<YtmPlaylistItem>({
      key,
      page: safePage,
      limit: this.limit_list,
      isRefresh,
      getItemId: item => item.id,
      // eslint-disable-next-line @typescript-eslint/promise-function-async
      fetcher: () => {
        if (safeSort === 'charts') {
          const chartReq = fetchChartsPlaylists(ctx)
          return attachCancel(
            chartReq.then(({ items, partial }) => ({ items, continuation: null, ephemeral: partial })),
            () => chartReq.cancel?.(),
          )
        }
        if (effectiveTag) {
          const httpReq = postInnerTube(
            'browse',
            { browseId: 'FEmusic_moods_and_genres_category', params: effectiveTag },
            ctx.lockedProxy,
            YTM_REQUEST_TIMEOUT_MS,
            ctx.contextKey,
          )
          return attachCancel(
            httpReq.then(body => {
              const parsed = parseYtmBrowsePlaylists(body)
              if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
              if (parsed.list.length) markYtmContextReachable(ctx.contextKey)
              return { items: parsed.list, continuation: null }
            }),
            () => httpReq.cancel?.(),
          )
        }
        const homeReq = postInnerTube('browse', { browseId: 'FEmusic_home' }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
        return attachCancel(
          homeReq.then(body => {
            const parsed = parseYtmBrowsePlaylists(body)
            if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
            if (parsed.list.length) markYtmContextReachable(ctx.contextKey)
            return { items: parsed.list, continuation: null }
          }),
          () => homeReq.cancel?.(),
        )
      },
    })

    return attachCancel(
      req.then(win => ({
        list: win.list.map(clonePlaylistItem),
        total: win.total,
        page: safePage,
        limit: win.limit,
        source: 'ytm' as const,
        ...(win.ephemeral ? { partial: true } : {}),
      })),
      () => req.cancel?.(),
    )
  },

  // eslint-disable-next-line @typescript-eslint/promise-function-async
  getListDetail(id: string, page = 1, isRefresh = false, options?: YtmPlaylistDetailFetchOptions) {
    return fetchPlaylistDetailWindow(id, page, this.limit_song, isRefresh, options)
  },

  search(str: string, page = 1, limit = 18): YtmCancellablePromise<{
    list: YtmPlaylistItem[]
    limit: number
    total: number
    source: 'ytm'
    hasMore: boolean
    partialFailure?: boolean
  }> {
    const normalizedQuery = String(str ?? '').trim()
    const safePage = toPositiveInt(page, 1)
    const safeLimit = toPositiveInt(limit, 18)
    const ctx = resolveLiveYtmProxy()
    const key = `${ctx.contextKey}::search:playlists::${normalizedQuery}`

    const req = sharedYtmPaginationCache.fetchWindow<YtmPlaylistItem>({
      key,
      page: safePage,
      limit: safeLimit,
      getItemId: item => item.id,
      // eslint-disable-next-line @typescript-eslint/promise-function-async
      fetcher: (cursor) => {
        if (!cursor.isInitial) {
          const contReq = postInnerTube('search', { continuation: cursor.continuation }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
          return attachCancel(
            contReq.then(body => {
              const parsed = parseYtmSearchPlaylistsPage(body)
              if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
              if (parsed.list.length) markYtmContextReachable(ctx.contextKey)
              return { items: parsed.list, continuation: parsed.continuation }
            }),
            () => contReq.cancel?.(),
          )
        }
        const commReq = postInnerTube(
          'search',
          { query: normalizedQuery, params: YTM_SEARCH_PARAMS.communityPlaylists },
          ctx.lockedProxy,
          YTM_REQUEST_TIMEOUT_MS,
          ctx.contextKey,
        )
        const featReq = postInnerTube(
          'search',
          { query: normalizedQuery, params: YTM_SEARCH_PARAMS.featuredPlaylists },
          ctx.lockedProxy,
          YTM_REQUEST_TIMEOUT_MS,
          ctx.contextKey,
        )
        commReq.catch(() => {})
        featReq.catch(() => {})
        let cancelled = false

        const p = Promise.allSettled([commReq, featReq]).then(results => {
          if (cancelled) throw new Error('request cancelled')
          const [commRes, featRes] = results
          const items: YtmPlaylistItem[] = []
          const seen = new Set<string>()
          let commCont: string | null = null
          let featCont: string | null = null
          let validCount = 0
          let firstErr: unknown = null

          const consume = (r: PromiseSettledResult<Record<string, any>>, isFeatured: boolean) => {
            if (r.status === 'rejected') {
              firstErr ??= r.reason
              return
            }
            const parsed = parseYtmSearchPlaylistsPage(r.value)
            if (!parsed.hasValidContainer) {
              firstErr ??= new MusicSdkResponseError()
              return
            }
            validCount++
            if (isFeatured) featCont = parsed.continuation
            else commCont = parsed.continuation
            for (const pl of parsed.list) {
              if (seen.has(pl.id)) continue
              seen.add(pl.id)
              items.push(pl)
            }
          }

          // Featured 官方歌单优先排前，Community 社区歌单紧随其后；双游标均保留续页能力
          consume(featRes, true)
          consume(commRes, false)
          if (!validCount) throw firstErr ?? new MusicSdkResponseError()
          if (items.length) markYtmContextReachable(ctx.contextKey)

          return {
            items,
            continuation: commCont,
            extraCursors: featCont ? [{ channel: 'featured', continuation: featCont }] : [],
            // 任一分支失败时不持久化残缺流，允许用户重查恢复
            ephemeral: validCount < results.length,
          }
        })

        return attachCancel(p, () => {
          cancelled = true
          commReq.cancel?.()
          featReq.cancel?.()
        })
      },
    })

    return attachCancel(
      req.then(win => ({
        list: win.list.map(clonePlaylistItem),
        limit: win.limit,
        total: win.total,
        source: 'ytm' as const,
        hasMore: win.hasMore,
        ...(win.ephemeral ? { partialFailure: true } : {}),
      })),
      () => req.cancel?.(),
    )
  },

  getDetailPageUrl(id: string) {
    const raw = String(id ?? '').trim()
    const canonical = normalizeYtmPlaylistId(raw)
    const listId = (canonical ?? raw).replace(/^VL/i, '')
    return `https://music.youtube.com/playlist?list=${encodeURIComponent(listId)}`
  },
}

export const leaderboard = {
  limit: 50,
  getDetailPageUrl(bangId: string) {
    const raw = String(bangId ?? '').trim().replace(/^ytm__/i, '')
    const canonical = normalizeYtmPlaylistId(raw)
    const listId = (canonical ?? raw).replace(/^VL/i, '')
    return `https://music.youtube.com/playlist?list=${encodeURIComponent(listId)}`
  },
  getBoards(): YtmCancellablePromise<{ list: YtmBoardItem[], source: 'ytm', partial?: boolean }> {
    const ctx = resolveLiveYtmProxy()
    const localReq = postInnerTube('browse', { browseId: 'FEmusic_charts' }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
    const globalReq = postInnerTube('browse', { browseId: 'FEmusic_charts', formData: { selectedValues: ['ZZ'] } }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
    localReq.catch(() => {})
    globalReq.catch(() => {})
    let cancelled = false

    const p = Promise.allSettled([localReq, globalReq]).then(results => {
      if (cancelled) throw new Error('request cancelled')
      const list: YtmBoardItem[] = []
      const seen = new Set<string>()
      let validCount = 0
      let firstErr: unknown = null

      for (const r of results) {
        if (r.status === 'rejected') {
          firstErr ??= r.reason
          continue
        }
        const parsed = parseYtmCharts(r.value)
        if (!parsed.hasValidContainer) {
          firstErr ??= new MusicSdkResponseError()
          continue
        }
        validCount++
        for (const board of parsed.list) {
          if (seen.has(board.bangid)) continue
          seen.add(board.bangid)
          list.push(board)
        }
      }
      if (!validCount) throw firstErr ?? new MusicSdkResponseError()
      if (list.length) markYtmContextReachable(ctx.contextKey)
      return {
        list,
        source: 'ytm' as const,
        ...(validCount < results.length ? { partial: true } : {}),
      }
    })

    return attachCancel(p, () => {
      cancelled = true
      localReq.cancel?.()
      globalReq.cancel?.()
    })
  },

  // eslint-disable-next-line @typescript-eslint/promise-function-async
  getList(bangId: string, page = 1, isRefresh = false, options?: YtmPlaylistDetailFetchOptions) {
    return fetchPlaylistDetailWindow(bangId, page, this.limit, isRefresh, options)
  },
}

const hotSearch = {
  _requestObj: null as YtmCancellablePromise<any> | null,
  _requestSeq: 0,
  async getList(): Promise<{ source: 'ytm', list: string[] }> {
    const seq = ++this._requestSeq
    if (this._requestObj) {
      this._requestObj.cancel?.()
      this._requestObj = null
    }
    const ctx = resolveLiveYtmProxy()
    let activeReq: YtmCancellablePromise<any> | null = null
    const fetchChartsTerms = async(formData?: Record<string, unknown>) => {
      if (seq !== this._requestSeq) throw new Error('request cancelled')
      const payload: Record<string, unknown> = { browseId: 'FEmusic_charts' }
      if (formData) payload.formData = formData
      const req = postInnerTube('browse', payload, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
      activeReq = req
      this._requestObj = req
      try {
        return await req
      } finally {
        if (this._requestObj === req) this._requestObj = null
      }
    }
    try {
      const body = await fetchChartsTerms()
      if (seq !== this._requestSeq) throw new Error('request cancelled')
      const parsed = parseYtmHotSearchTerms(body)
      if (parsed.hasValidContainer && parsed.list.length) {
        markYtmContextReachable(ctx.contextKey)
        return { source: 'ytm', list: parsed.list }
      }
      const globalBody = await fetchChartsTerms({ selectedValues: ['ZZ'] })
      if (seq !== this._requestSeq) throw new Error('request cancelled')
      const globalParsed = parseYtmHotSearchTerms(globalBody)
      if (!globalParsed.hasValidContainer) throw new MusicSdkResponseError()
      if (globalParsed.list.length) markYtmContextReachable(ctx.contextKey)
      return { source: 'ytm', list: globalParsed.list }
    } finally {
      if (activeReq && this._requestObj === activeReq) this._requestObj = null
    }
  },
}

const tipSearch = {
  requestObj: null as YtmCancellablePromise<any> | null,
  cancelTipSearch() {
    if (this.requestObj) {
      this.requestObj.cancel?.()
      this.requestObj = null
    }
  },
  async search(str: string): Promise<string[]> {
    const query = String(str ?? '').trim()
    this.cancelTipSearch()
    if (!query) return []
    const ctx = resolveLiveYtmProxy()
    const req = postInnerTube('music/get_search_suggestions', { input: query }, ctx.lockedProxy, YTM_REQUEST_TIMEOUT_MS, ctx.contextKey)
    this.requestObj = req
    try {
      const body = await req
      const list = parseYtmSearchSuggestions(body)
      if (list.length) markYtmContextReachable(ctx.contextKey)
      return list
    } finally {
      if (this.requestObj === req) this.requestObj = null
    }
  },
}

const simiSong = {
  limit: 20,
  getSimiSong(videoId: string): YtmCancellablePromise<{ source: 'ytm', list: YtmLegacySongRow[] }> {
    const vid = String(videoId ?? '').trim()
    if (!vid) return attachCancel(Promise.reject(new Error('invalid videoId')), () => {})
    const ctx = resolveLiveYtmProxy()
    const req = postInnerTube(
      'next',
      { videoId: vid, playlistId: `RDAMVM${vid}`, isAudioOnly: true },
      ctx.lockedProxy,
      YTM_REQUEST_TIMEOUT_MS,
      ctx.contextKey,
    )
    return attachCancel(
      req.then(body => {
        const parsed = parseYtmNextRadio(body, vid)
        if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
        if (parsed.tracks.length) markYtmContextReachable(ctx.contextKey)
        return {
          source: 'ytm' as const,
          list: parsed.tracks.slice(0, this.limit).map(toLegacyYtmSong),
        }
      }),
      () => req.cancel?.(),
    )
  },
}

const ytm = {
  musicSearch,
  singer,
  album,
  songList,
  leaderboard,
  hotSearch,
  tipSearch,
  simiSong,
  getMusicUrl(songInfo: any, type: LX.Quality = '128k', options?: YtmMusicUrlOptions) {
    return getYtmMusicUrl(songInfo, type, options)
  },
  getLyric(songInfo: any) {
    return getYtmLyric(songInfo)
  },
  async getPic(songInfo: any) {
    return getYtmTrackPic(songInfo)
  },
  getMusicDetailPageUrl(songInfo: any) {
    const vid = String(songInfo?.songmid ?? songInfo?.meta?.songId ?? '').trim()
    return `https://music.youtube.com/watch?v=${encodeURIComponent(vid)}`
  },
}

export default ytm
