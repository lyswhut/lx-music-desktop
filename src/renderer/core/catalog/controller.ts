import { markRawList } from '@common/utils/vueTools'
import { CatalogError, getCatalogSourceLabel, type createCatalogAdapter } from './adapter'
import { type CatalogKind, type CatalogTarget } from './types'

export const createCatalogState = () => ({
  show: false,
  title: '',
  loading: false,
  error: '',
  targets: [] as CatalogTarget[],
  target: null as CatalogTarget | null,
  list: [] as LX.Music.MusicInfoOnline[],
  page: 0,
  limit: 50,
  total: null as number | null,
  hasMore: false,
})

export interface CatalogControllerOptions {
  onPageAppended?: (target: CatalogTarget, additions: LX.Music.MusicInfoOnline[]) => void
  onStateReset?: () => void
}

/** Plain state + injected SDK make stale requests and retry behavior independently testable. */
export const createCatalogController = (
  state: ReturnType<typeof createCatalogState>,
  adapter: ReturnType<typeof createCatalogAdapter>,
  options?: CatalogControllerOptions,
) => {
  let revision = 0
  let origin: { kind: CatalogKind, music: LX.Music.MusicInfo } | null = null
  const reportError = (error: unknown) => {
    state.error = error instanceof CatalogError ? error.message : window.i18n.t('catalog__load_error')
  }
  const loadMore = async() => {
    if (!state.show || !state.target || state.loading || !state.hasMore) return
    options?.onStateReset?.()
    const target = state.target
    const requestRevision = ++revision
    state.loading = true
    state.error = ''
    try {
      const result = await adapter.load(target, state.page + 1, state.limit)
      if (requestRevision !== revision || !state.show) return
      const ids = new Set(state.list.map(item => item.id))
      const additions = markRawList(result.list.filter(item => {
        if (ids.has(item.id)) return false
        ids.add(item.id)
        return true
      }))
      if (!additions.length && result.hasMore) throw new CatalogError('response', window.i18n.t('catalog__no_new_songs'))
      state.list = [...state.list, ...additions]
      state.page = result.page
      state.limit = result.limit
      state.total = result.total
      state.hasMore = result.hasMore
      // 仅在手动续拉后续页（page > 1）时向正在播放的同目录 TEMP 队列追加，避免重开目录首屏覆写已播队列
      if (result.page > 1 && additions.length) {
        options?.onPageAppended?.(target, additions)
      }
    } catch (error) {
      if (requestRevision === revision && state.show) reportError(error)
    } finally {
      if (requestRevision === revision) state.loading = false
    }
  }
  const select = async(target: CatalogTarget) => {
    ++revision
    options?.onStateReset?.()
    state.target = target
    state.title = window.i18n.t(target.kind === 'artist' ? 'catalog__artist_title' : 'catalog__album_title', { name: target.name }) + ` · ${getCatalogSourceLabel(target.source)}`
    state.loading = false
    state.error = ''
    state.list = []
    state.page = 0
    state.limit = 50
    state.total = null
    state.hasMore = true
    await loadMore()
  }
  const openTarget = async(target: CatalogTarget) => {
    ++revision
    options?.onStateReset?.()
    origin = null
    Object.assign(state, createCatalogState(), {
      show: true,
      targets: [target],
      title: window.i18n.t(target.kind === 'artist' ? 'catalog__artist_title' : 'catalog__album_title', { name: target.name }) + ` · ${getCatalogSourceLabel(target.source)}`,
    })
    await select(target)
  }
  const open = async(kind: CatalogKind, music: LX.Music.MusicInfo) => {
    const requestRevision = ++revision
    options?.onStateReset?.()
    origin = { kind, music }
    Object.assign(state, createCatalogState(), {
      show: true,
      loading: true,
      title: window.i18n.t(kind === 'artist' ? 'catalog__artist_title' : 'catalog__album_title', { name: kind === 'artist' ? music.singer : music.meta.albumName }),
    })
    try {
      const targets = await adapter.resolve(kind, music)
      if (requestRevision !== revision || !state.show) return
      state.targets = targets
      state.loading = false
      if (targets.length === 1) await select(targets[0])
    } catch (error) {
      if (requestRevision === revision && state.show) reportError(error)
    } finally {
      if (requestRevision === revision) state.loading = false
    }
  }
  const retry = async() => {
    if (state.target) await loadMore()
    else if (origin) await open(origin.kind, origin.music)
  }
  const close = () => {
    ++revision
    options?.onStateReset?.()
    state.show = false
    state.loading = false
  }
  return { open, openTarget, select, loadMore, retry, close }
}
