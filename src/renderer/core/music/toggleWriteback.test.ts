import { beforeEach, describe, expect, it, vi } from 'vitest'
import { playMusicInfo } from '@renderer/store/player/state'
import { writebackToggleMusicInfo } from './toggleWriteback'

vi.mock('@renderer/store/player/state', () => ({ playMusicInfo: { musicInfo: null, listId: 'love', isTempPlay: false } }))
const song = (id: string): LX.Music.MusicInfoOnline => ({ id, name: id, singer: 'Artist', source: 'kw', interval: null, meta: { songId: id, albumName: '', qualitys: [], _qualitys: {} } })
beforeEach(() => { vi.stubGlobal('window', { i18n: { t: (key: string) => key === 'player__temporary_version_notice' ? '临时播放' : key } }); Object.assign(playMusicInfo, { musicInfo: null, resolvedMusicInfo: undefined, versionNotice: undefined }) })
describe('temporary rescue preserves identity', () => {
  it.each([true, false])('never replaces the original saved or temporary item (temporary=%s)', async(isTempPlay) => {
    const original = song('original')
    const selected = song('selected')
    original.meta = { ...original.meta, toggleMusicInfo: selected, manualVersionPinned: true }
    const replacement = song('rescue')
    const savedList = [original, selected]
    const before = JSON.stringify(savedList)
    Object.assign(playMusicInfo, { musicInfo: original, isTempPlay })
    await writebackToggleMusicInfo(original, replacement)
    expect(playMusicInfo.musicInfo).toBe(original)
    expect(playMusicInfo.resolvedMusicInfo).toBe(replacement)
    expect(JSON.stringify(savedList)).toBe(before)
    expect(playMusicInfo.versionNotice).toContain('临时播放')
  })
  it('clears the rescue notice when the selected version is available', async() => {
    const original = song('original')
    const selected = song('selected')
    original.meta.toggleMusicInfo = selected
    playMusicInfo.musicInfo = original
    playMusicInfo.versionNotice = 'old rescue'
    await writebackToggleMusicInfo(original, selected)
    expect(playMusicInfo.versionNotice).toBeUndefined()
  })
  it('ignores a late result from a previous track', async() => {
    playMusicInfo.musicInfo = song('current')
    await writebackToggleMusicInfo(song('old'), song('rescue'))
    expect(playMusicInfo.resolvedMusicInfo).toBeUndefined()
  })
})

it.each(['download', 'local'])('records rescue details for %s containers without losing saved identity', async(kind) => {
  const base = song('original')
  base.meta.toggleMusicInfo = song('chosen')
  const original = kind === 'download'
    ? { id: 'download-original', progress: {}, metadata: { musicInfo: base } }
    : { ...base, source: 'local', meta: { ...base.meta, filePath: '/saved.mp3', ext: 'mp3' } }
  const rescued = song('rescued')
  const before = JSON.stringify(original)
  playMusicInfo.musicInfo = original as any
  await writebackToggleMusicInfo(original as any, rescued)
  expect(playMusicInfo.musicInfo).toBe(original)
  expect(playMusicInfo.resolvedMusicInfo).toBe(rescued)
  expect(playMusicInfo.versionNotice).toBe('临时播放')
  expect(JSON.stringify(original)).toBe(before)
})

it('suppresses temporary rescue notice for ytm tracks resolved to a domestic playback provider', async() => {
  const ytmTrack: LX.Music.MusicInfoOnline = {
    id: 'ytm_dQw4w9WgXcQ',
    name: '晴天',
    singer: '周杰伦',
    source: 'ytm',
    interval: '04:29',
    meta: { songId: 'dQw4w9WgXcQ', albumName: '叶惠美', qualitys: [{ type: '128k', size: '' }], _qualitys: { '128k': { size: '' } } },
  }
  const domestic = song('wy_186016')
  playMusicInfo.musicInfo = ytmTrack
  playMusicInfo.versionNotice = 'stale notice'
  await writebackToggleMusicInfo(ytmTrack, domestic)
  expect(playMusicInfo.musicInfo).toBe(ytmTrack)
  expect(playMusicInfo.resolvedMusicInfo).toBe(domestic)
  expect(playMusicInfo.versionNotice).toBeUndefined()
})
