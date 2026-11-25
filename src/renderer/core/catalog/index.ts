import { reactive } from '@common/utils/vueTools'
import { setTempList } from '@renderer/store/list/action'
import { tempListMeta } from '@renderer/store/list/state'
import { capturePlaybackOwner, playList } from '@renderer/core/player/action'
import { playInfo } from '@renderer/store/player/state'
import { queueSession } from '@renderer/store/player/queueSession'
import { assertPlaybackSupport } from '@renderer/core/music/sourceCapabilities'
import { createCatalogController, createCatalogState } from './controller'
import { appendUniqueToQueueSession, createCatalogPlayback } from './playback'
import { catalogAdapter } from './sdk'
import { type CatalogKind, type CatalogTarget } from './types'

export const catalogState = reactive(createCatalogState())

const catalogPlayback = createCatalogPlayback({
  state: catalogState,
  adapter: catalogAdapter,
  setTempList,
  playList,
  getTempListId: () => tempListMeta.id,
  getPlayerListId: () => playInfo.playerListId,
  isSelectionQueue: () => playInfo.isSelectionQueue === true,
  capturePlaybackOwner,
  assertPlaybackSupport,
  appendToQueueSession: (additions) => {
    appendUniqueToQueueSession(queueSession, additions)
  },
})

export const catalogActions = createCatalogController(catalogState, catalogAdapter, {
  onPageAppended: (target, additions) => {
    catalogPlayback.syncAppendedPage(target, additions)
  },
  onStateReset: () => {
    catalogPlayback.clearRetry()
  },
})

export const openMusicCatalog = (kind: CatalogKind, music: LX.Music.MusicInfo) => {
  void catalogActions.open(kind, music)
}

export const openCatalogTarget = (target: CatalogTarget) => {
  void catalogActions.openTarget(target)
}

export const playCatalogAt = catalogPlayback.playAt
export const playCatalogAll = catalogPlayback.playAll

export const retryCatalogAction = async() => {
  const { handled } = await catalogPlayback.retry()
  if (handled) return
  await catalogActions.retry()
}
