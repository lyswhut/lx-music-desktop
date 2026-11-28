import { formatPlayTime } from '../../index'

export const coverUrl = (cover, size = 480) => {
  const base = cover?.urls?.[0]
  if (!base) return ''
  if (cover.need_complete_url || !cover.uri) return base
  return `${base}${cover.uri}~c5_${size}x${size}.jpg`
}

export const unwrapTrack = item => item?.entity?.track_wrapper?.track ?? item?.entity?.track ?? item?.track ?? item

const qualityMap = { low: '128k', medium: '128k', higher: '128k', highest: '320k', lossless: 'flac' }
const qualityOrder = ['128k', '320k', 'flac', 'flac24bit']

export const formatTrack = item => {
  const track = unwrapTrack(item)
  if (!track?.id || !track.name) return null
  const _types = {}
  for (const quality of Object.keys(track.label_info?.quality_info ?? track.label_info?.quality_map ?? {})) {
    const type = qualityMap[quality]
    if (type) _types[type] = { size: null }
  }
  for (const rate of track.bit_rates ?? []) {
    const type = qualityMap[rate.quality]
    if (!type) continue
    const size = Number(rate.size)
    _types[type] = { size: size > 0 ? `${(size / 1024 / 1024).toFixed(2)}M` : null }
  }
  if (!Object.keys(_types).length) _types['128k'] = { size: null }
  const duration = Number(track.duration) || 0
  return {
    name: track.name,
    singer: (track.artists ?? []).map(artist => artist.name).filter(Boolean).join('、'),
    source: 'sd',
    songmid: String(track.id),
    albumId: String(track.album?.id ?? ''),
    albumName: track.album?.name ?? '',
    interval: formatPlayTime(Math.floor(duration / 1000)),
    img: coverUrl(track.album?.url_cover ?? track.url_cover),
    lrc: null,
    otherSource: null,
    types: qualityOrder.filter(type => _types[type]).map(type => ({ type, ..._types[type] })),
    _types,
    typeUrl: {},
  }
}

export const formatTracks = items => (items ?? []).map(formatTrack).filter(Boolean)

export const formatPlaylist = playlist => ({
  id: String(playlist.id),
  name: playlist.title ?? playlist.name ?? '',
  author: playlist.owner?.nickname ?? playlist.owner?.name ?? '',
  img: coverUrl(playlist.url_cover),
  desc: playlist.desc ?? playlist.intro ?? '',
  total: playlist.count_tracks ?? 0,
  play_count: '',
  source: 'sd',
})

// Soda returns opaque cursors and fixed server page sizes. Buffer those pages
// before slicing them to LX's requested limit, including direct page jumps.
export const createPager = fetchPage => {
  const cache = new Map()
  return async(key, page, limit) => {
    let state = cache.get(key)
    if (!state || page == 1) {
      state = { list: [], cursor: '', hasMore: true, total: null, info: undefined, pending: Promise.resolve() }
      cache.delete(key)
      cache.set(key, state)
      if (cache.size > 5) cache.delete(cache.keys().next().value)
    }
    const current = state
    const task = current.pending.then(async() => {
      const end = page * limit
      while (current.list.length < end && current.hasMore) {
        const result = await fetchPage(key, current.cursor)
        const next = String(result.cursor ?? '')
        current.list.push(...result.list)
        current.total = result.total ?? current.total
        current.info = result.info ?? current.info
        current.hasMore = Boolean(result.hasMore && next && next != current.cursor)
        if (current.total != null && current.list.length >= current.total) current.hasMore = false
        current.cursor = next
      }
      const total = current.hasMore ? Math.max(current.total ?? 0, current.list.length + limit) : current.list.length
      return {
        list: current.list.slice((page - 1) * limit, end),
        total,
        allPage: Math.ceil(total / limit),
        page,
        limit,
        source: 'sd',
        ...(current.info ? { info: current.info } : {}),
      }
    })
    current.pending = task.catch(() => {})
    return task
  }
}
