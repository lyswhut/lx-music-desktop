import { httpFetch } from '../../request'
import { request } from './api'
import { searchPage } from './musicSearch'
import { createPager, formatTracks, formatPlaylist, coverUrl } from './utils'
import leaderboard from './leaderboard'

const searchLists = createPager((keyword, cursor) => searchPage('playlist', keyword, cursor))
const playlistDetail = createPager(async(id, cursor) => {
  const body = await request('/luna/playlist/detail', {
    body: { cursor, feed_playlist_extra: {}, playlist_id: id },
  }).promise
  const resources = body.media_resources ?? body.tracks ?? []
  if (!body.playlist || !Array.isArray(resources)) throw new Error('汽水音乐歌单获取失败')
  return {
    list: formatTracks(resources),
    cursor: body.next_cursor,
    hasMore: Boolean(body.next_cursor),
    total: body.playlist.count_tracks,
    info: formatPlaylist(body.playlist),
  }
})

const parseId = text => {
  if (/^(?:chart_|album_|artist_)?\d+$/.test(text)) return text
  const query = /[?&](playlist_id|album_id|artist_id|chart_id)=(\d+)/.exec(text)
  if (query) return (query[1] == 'playlist_id' ? '' : query[1].replace('_id', '_')) + query[2]
  const path = /\/(playlist|album|artist|chart)s?\/(\d+)/.exec(text)
  return path ? (path[1] == 'playlist' ? '' : `${path[1]}_`) + path[2] : null
}

export const resolveId = async input => {
  const text = String(input).trim()
  const id = parseId(text)
  if (id) return id
  const match = /https?:\/\/(?:qishui\.douyin\.com|music\.douyin\.com|(?:www\.)?qishui\.com)\/[^\s<>"“”]+/.exec(text)
  if (!match) throw new Error('无效的汽水音乐歌单链接或 ID')
  let url = match[0]
  for (let i = 0; i < 5; i++) {
    const response = await httpFetch(url, { headers: { 'User-Agent': 'okhttp/3.10.0' }, follow_max: 0 }).promise
    const location = response.headers?.location ?? response.url
    if (!location || location == url) break
    url = location.startsWith('/') ? url.replace(/^(https?:\/\/[^/]+).*$/, '$1') + location : location
    const id = parseId(url)
    if (id) return id
    // Only follow official Soda share links.
    if (!/^https?:\/\/(?:qishui\.douyin\.com|music\.douyin\.com|(?:www\.)?qishui\.com)\//.test(url)) break
  }
  throw new Error('无法解析汽水音乐分享链接')
}

const artistDetail = createPager(async(id, cursor) => {
  const body = await request(`/luna/artists/${id}/tracks`, { params: { cursor: cursor || '0', count: '50', sort_type: '0' } }).promise
  if (!Array.isArray(body.tracks)) throw new Error('汽水音乐歌手歌曲获取失败')
  return { list: formatTracks(body.tracks), cursor: body.next_cursor, hasMore: body.has_more }
})

export default {
  sortList: [{ id: 'charts', name: '排行榜' }],
  limit_list: 3,
  limit_song: 50,
  async getTags() {
    return { tags: [], hotTag: [], source: 'sd' }
  },
  async getList(sortId, tagId, page = 1) {
    return {
      list: page == 1 ? leaderboard.list.map(board => ({
        id: `chart_${board.bangid}`,
        name: board.name,
        source: 'sd',
        img: '',
        author: '汽水音乐',
        desc: '',
        play_count: '',
      })) : [],
      total: leaderboard.list.length,
      page,
      limit: this.limit_list,
      source: 'sd',
    }
  },
  search(keyword, page = 1, limit = 20) {
    return searchLists(keyword, page, limit)
  },
  async getListDetail(input, page = 1) {
    const id = await resolveId(input)
    if (id.startsWith('chart_')) {
      const chartId = id.slice(6)
      const result = await leaderboard.getList(chartId, page)
      return { ...result, info: { name: leaderboard.list.find(board => board.bangid == chartId)?.name ?? '', author: '汽水音乐', img: '', desc: '', play_count: '' } }
    }
    if (id.startsWith('album_')) {
      const body = await request(`/luna/albums/${id.slice(6)}`).promise
      if (!body.album_info || !Array.isArray(body.tracks)) throw new Error('汽水音乐专辑获取失败')
      const album = body.album_info
      const list = formatTracks(body.tracks)
      return {
        list: list.slice((page - 1) * this.limit_song, page * this.limit_song),
        total: list.length,
        limit: this.limit_song,
        page,
        source: 'sd',
        info: { name: album.name, img: coverUrl(album.url_cover), desc: album.intro ?? '', author: (album.artists ?? []).map(artist => artist.name).join('、'), play_count: '' },
      }
    }
    if (id.startsWith('artist_')) return artistDetail(id.slice(7), page, this.limit_song)
    return playlistDetail(id, page, this.limit_song)
  },
  async getDetailPageUrl(input) {
    const id = await resolveId(input)
    const match = /^(chart|album|artist)_(\d+)$/.exec(id)
    const type = match?.[1] ?? 'playlist'
    return `https://music.douyin.com/qishui/share/${type}?${type}_id=${match?.[2] ?? id}`
  },
}
