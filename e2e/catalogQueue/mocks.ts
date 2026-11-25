// Deterministic component fixture: actual queue mutation module, no audio/network/IPC.
import { ref, shallowReactive } from 'vue'
import { queueSession, getQueueSource, resetQueueSession } from '../../src/renderer/store/player/queueSession'
export const song = (id: string) => ({ id, name: id, singer: 'Example artist', source: 'wy', interval: null, meta: { songId: id, albumName: 'Example album', albumId: 8, qualitys: [], _qualitys: {} } })
export const saved = ['First song', 'Second song', 'Third song'].map(song)
export const playInfo = shallowReactive({ playerListId: 'saved', playerPlayIndex: 0, isSelectionQueue: false })
export const playMusicInfo = shallowReactive({ musicInfo: saved[0], listId: 'saved', isTempPlay: false, versionNotice: '' })
export const tempPlayList = shallowReactive<any[]>([])
export const playedList = []
export const appSetting = shallowReactive({ 'player.togglePlayMethod': 'list', 'common.randomAnimate': false, 'download.enable': true, 'list.actionButtonsVisible': false, 'list.isClickPlayList': false })
export const getList = () => saved
export const getPlaybackList = (id: string) => getQueueSource(id, saved)
export const clearTempPlayeList = () => { tempPlayList.splice(0) }
export const clearPlayedList = () => {}
export const setPlayListId = (id: any) => { resetQueueSession(); playInfo.playerListId = id }
export const setPlayMusicInfo = (id: any, music: any) => { playMusicInfo.listId = id; playMusicInfo.musicInfo = music }
export const getCachedRandomNextMusicInfo = () => null
export const capturePlaybackOwner = () => () => true
export const capturePlaybackContext = () => () => true
export const resetRandomNextMusicInfo = () => {}
export const stop = () => {}
export const playQueueMusic = (item: any) => {
  Object.assign(playMusicInfo, item)
  if (!item.isTempPlay) playInfo.playerPlayIndex = getPlaybackList(playInfo.playerListId).findIndex(x => x.id === item.musicInfo.id)
}
export const getNextPlayMusicInfo = async() => !playMusicInfo.musicInfo ? null : tempPlayList[0] ?? (getPlaybackList(playInfo.playerListId)[playInfo.playerPlayIndex + 1] ? { musicInfo: getPlaybackList(playInfo.playerListId)[playInfo.playerPlayIndex + 1], listId: playInfo.playerListId, isTempPlay: false } : null)
export const filterList = async({ list, playerMusicInfo }: any) => ({ filteredList: list, playerIndex: list.indexOf(playerMusicInfo) })
export const getPreferredMusicInfo = (music: any) => music
export const getRandom = () => 0
export const assertPlaybackSupport = () => true
export const listEvents = { selections: [] as number[], plays: [] as number[], defaultPlays: [] as number[] }
export const playList = (_listId: string, index: number) => { listEvents.defaultPlays.push(index) }
export const defaultList = { id: 'saved' }
export const getListMusics = async() => saved
export const addListMusics = async() => {}
export const addTempPlayList = () => {}
export const clipboardWriteText = () => {}
export const assertApiSupport = () => true
export const hasDislike = () => false
export const useI18n = () => (key: string) => (window as any).i18n.t(key)
export default {}
export const playMusicSelection = () => {}
export const playCatalogAt = async(index: number) => { listEvents.plays.push(index); return true }
export const playCatalogAll = async() => { listEvents.plays.push(0); return true }
export const retryCatalogAction = async() => {}
export const openCatalogTarget = () => {}
export const setTempList = async() => {}
export const tempListMeta = { id: null as string | null }
export const sourceNames = ref({ kw: '酷我音乐', kg: '酷狗音乐', tx: 'QQ音乐', wy: '网易云音乐', mg: '咪咕音乐', all: '聚合搜索' })
export const catalogState = shallowReactive({ show: false, title: 'Example artist · songs', targets: [], target: { source: 'wy', kind: 'artist', id: 1, name: 'Example artist' }, list: saved, loading: false, error: '', total: 3, hasMore: false })
export const catalogActions = { close: () => { catalogState.show = false }, retry: () => {}, select: () => {}, loadMore: () => {}, openTarget: () => {} }
;(window as any).fixture = { saved, playInfo, playMusicInfo, tempPlayList, queueSession, appSetting, catalogState, listEvents }
