import { LIST_IDS } from '@common/constants'
import { markRawList } from '@common/utils/vueTools'
import { unwrapMusicInfos } from '@renderer/store/list/listManage/rawUnwrap'
import { CatalogError, type createCatalogAdapter } from './adapter'
import { type createCatalogState } from './controller'
import { type CatalogTarget } from './types'

export const MAX_CATALOG_PLAY_ALL_PAGES = 10

export const getCatalogTempListId = (target: CatalogTarget): string =>
  `catalog__${target.source}__${target.kind}__${target.id}`

const isSameTarget = (a: CatalogTarget | null, b: CatalogTarget | null): boolean =>
  a != null && b != null && a.source === b.source && a.kind === b.kind && String(a.id) === String(b.id)

const unwrapRawSongs = (list: LX.Music.MusicInfoOnline[]): LX.Music.MusicInfoOnline[] =>
  markRawList(unwrapMusicInfos(list) as LX.Music.MusicInfoOnline[])

export interface QueueSessionLike {
  listId: string | null
  list: Array<LX.Music.MusicInfo | LX.Download.ListItem> | null
  revision: number
}

/** 保持用户重排后的 queueSession 顺序，仅按 ID 去重追加目录续拉新曲目。 */
export const appendUniqueToQueueSession = (
  session: QueueSessionLike,
  additions: LX.Music.MusicInfoOnline[],
): boolean => {
  if (session.listId !== LIST_IDS.TEMP || session.list === null) return false
  const existingIds = new Set(session.list.map(item => item.id))
  const newItems = additions.filter(item => {
    if (existingIds.has(item.id)) return false
    existingIds.add(item.id)
    return true
  })
  if (!newItems.length) return false
  session.list = [...session.list, ...newItems]
  session.revision++
  return true
}

export interface CatalogPlaybackDeps {
  state: ReturnType<typeof createCatalogState>
  adapter: Pick<ReturnType<typeof createCatalogAdapter>, 'load'>
  setTempList: (id: string, list: LX.Music.MusicInfoOnline[]) => Promise<void>
  playList: (listId: string, index: number, options?: { pauseRadio?: boolean }) => void
  getTempListId: () => string | null
  getPlayerListId: () => string | null
  isSelectionQueue?: () => boolean
  capturePlaybackOwner: () => () => boolean
  assertPlaybackSupport: (source: LX.Source) => boolean
  appendToQueueSession?: (additions: LX.Music.MusicInfoOnline[]) => void
}

type AppendStatus = 'appended' | 'duplicate' | 'inactive' | 'error'

/**
 * 艺术家/专辑目录播放编排：
 * - 单曲点播与一键播放均深度剥离 Vue 代理后写入 LIST_IDS.TEMP 并以 pauseRadio 模式起播，确保上一首/下一首双向正常、不被电台抢歌且无 IPC DataCloneError；
 * - 一键播放先在首个 await 前冻结目标/列表/分页游标，立即起播后在后台串行续拉剩余分页（上限 10 页），与手动加载更多协同去重且不跳页污染重开弹窗；
 * - 写入失败时登记可消费的重试动作供弹窗重试按钮重放（区分「已消费」与「无待重试」避免穿透到 loadMore），成功后自动清理错误态。
 */
export const createCatalogPlayback = (deps: CatalogPlaybackDeps) => {
  let playSeq = 0
  let activeListId: string | null = null
  let activeList: LX.Music.MusicInfoOnline[] = []
  let activeIds = new Set<string>()
  let writeTail: Promise<void> = Promise.resolve()
  let lastFailedRetry: { target: CatalogTarget, action: () => Promise<boolean> } | null = null

  const enqueueWrite = async(task: () => Promise<void>): Promise<void> => {
    const run = writeTail.then(task)
    writeTail = run.catch(() => {})
    await run
  }

  const isQueueOwned = (listId: string): boolean =>
    activeListId === listId &&
    deps.getTempListId() === listId &&
    deps.getPlayerListId() === LIST_IDS.TEMP &&
    (deps.isSelectionQueue ? deps.isSelectionQueue() : true)

  const clearRetry = () => {
    lastFailedRetry = null
  }

  const clearModalError = (target: CatalogTarget) => {
    if (lastFailedRetry && isSameTarget(lastFailedRetry.target, target)) lastFailedRetry = null
    if (deps.state.show && isSameTarget(deps.state.target, target)) deps.state.error = ''
  }

  const reportModalError = (target: CatalogTarget, error: unknown, retryAction?: () => Promise<boolean>) => {
    if (!deps.state.show || !isSameTarget(deps.state.target, target)) return
    lastFailedRetry = retryAction ? { target, action: retryAction } : null
    const fallback = globalThis.window?.i18n?.t('catalog__load_error') ?? 'Catalog playback failed'
    deps.state.error = error instanceof CatalogError ? error.message : fallback
  }

  const startSnapshot = async(
    target: CatalogTarget,
    rawList: LX.Music.MusicInfoOnline[],
    index: number,
    retryAction: () => Promise<boolean>,
  ): Promise<{ started: boolean, seq: number, listId: string }> => {
    const music = rawList[index]
    const listId = getCatalogTempListId(target)
    if (!music || !deps.assertPlaybackSupport(music.source)) {
      return { started: false, seq: playSeq, listId }
    }
    const seq = ++playSeq
    const ownsBeforeWrite = deps.capturePlaybackOwner()
    let wrote = false
    try {
      await enqueueWrite(async() => {
        if (seq !== playSeq || !ownsBeforeWrite()) return
        await deps.setTempList(listId, [...rawList])
        wrote = true
      })
    } catch (error) {
      console.error(error)
      reportModalError(target, error, retryAction)
      return { started: false, seq, listId }
    }
    // 等待 IPC 期间若用户切播了其他列表或再次发起新点播，绝不抢回播放权
    if (!wrote || seq !== playSeq || !ownsBeforeWrite() || deps.getTempListId() !== listId) {
      return { started: false, seq, listId }
    }
    clearModalError(target)
    activeListId = listId
    activeList = [...rawList]
    activeIds = new Set(rawList.map(item => item.id))
    deps.playList(LIST_IDS.TEMP, index, { pauseRadio: true })
    return { started: true, seq, listId }
  }

  const appendToActiveQueue = async(
    target: CatalogTarget,
    additions: LX.Music.MusicInfoOnline[],
    customRetry?: () => Promise<boolean>,
  ): Promise<AppendStatus> => {
    const listId = getCatalogTempListId(target)
    const rawAdditions = unwrapRawSongs(additions)
    if (!rawAdditions.length) return 'duplicate'
    try {
      let status: AppendStatus = 'inactive'
      await enqueueWrite(async() => {
        if (!isQueueOwned(listId)) {
          status = 'inactive'
          return
        }
        const seen = new Set<string>()
        const unique = rawAdditions.filter(item => {
          if (activeIds.has(item.id) || seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
        if (!unique.length) {
          status = 'duplicate'
          return
        }
        const nextList = [...activeList, ...unique]
        await deps.setTempList(listId, nextList)
        activeList.push(...unique)
        for (const item of unique) activeIds.add(item.id)
        if (isQueueOwned(listId)) {
          deps.appendToQueueSession?.(unique)
        }
        clearModalError(target)
        status = 'appended'
      })
      return status
    } catch (error) {
      console.error(error)
      reportModalError(target, error, customRetry ?? (async() => {
        const retried = await appendToActiveQueue(target, rawAdditions)
        return retried === 'appended' || retried === 'duplicate'
      }))
      return 'error'
    }
  }

  const syncConsecutiveModalPage = (
    target: CatalogTarget,
    page: number,
    limit: number,
    total: number | null,
    hasMore: boolean,
    rawPageList: LX.Music.MusicInfoOnline[],
  ) => {
    // 严格仅合并紧邻当前弹窗页的下一页，避免关闭重开同目录后跳页缺洞
    if (
      !deps.state.show ||
      !isSameTarget(deps.state.target, target) ||
      deps.state.loading ||
      page !== deps.state.page + 1
    ) {
      return
    }
    const uiIds = new Set(deps.state.list.map(item => item.id))
    const uiAdditions = rawPageList.filter(item => {
      if (uiIds.has(item.id)) return false
      uiIds.add(item.id)
      return true
    })
    if (uiAdditions.length) {
      deps.state.list = [...deps.state.list, ...uiAdditions]
    }
    deps.state.page = page
    deps.state.limit = limit
    deps.state.total = total
    deps.state.hasMore = hasMore
  }

  const continuePlayAll = async(
    target: CatalogTarget,
    seq: number,
    listId: string,
    startNextPage: number,
    startLimit: number,
    startHasMore: boolean,
    startExtraPages: number,
    playAllSeenIds: Set<string>,
  ): Promise<void> => {
    let nextPage = startNextPage
    let limit = startLimit
    let hasMore = startHasMore
    let extraPages = startExtraPages
    const isStillActive = () => seq === playSeq && isQueueOwned(listId)

    while (hasMore && extraPages < MAX_CATALOG_PLAY_ALL_PAGES && isStillActive()) {
      // 若手动「加载更多」已推进同目录分页，在 await 前完整冻结快照再合并，避免切目录污染游标
      if (deps.state.show && isSameTarget(deps.state.target, target) && deps.state.page >= nextPage) {
        const modalRaw = unwrapRawSongs(deps.state.list)
        const modalPage = deps.state.page
        const modalLimit = deps.state.limit
        const modalHasMore = deps.state.hasMore
        const syncStatus = await appendToActiveQueue(target, modalRaw)
        if (syncStatus === 'inactive' || syncStatus === 'error') break
        for (const item of modalRaw) playAllSeenIds.add(item.id)
        nextPage = modalPage + 1
        limit = modalLimit
        hasMore = modalHasMore
        continue
      }

      extraPages++
      let pageData
      try {
        pageData = await deps.adapter.load(target, nextPage, limit)
      } catch (error) {
        reportModalError(target, error)
        break
      }
      if (!isStillActive()) break

      const rawPageList = unwrapRawSongs(pageData.list)
      const hasNewForLoop = rawPageList.some(item => !playAllSeenIds.has(item.id))
      if (!hasNewForLoop) {
        if (pageData.hasMore) {
          const msg = globalThis.window?.i18n?.t('catalog__no_new_songs') ?? 'No new catalog songs returned'
          reportModalError(target, new CatalogError('response', msg))
        } else {
          // 未知总数目录返回合法空末页时同步弹窗终止状态，避免「加载更多」按钮残留
          syncConsecutiveModalPage(target, pageData.page, pageData.limit, pageData.total, false, [])
        }
        break
      }

      const retryPage = pageData
      const retryExtraPages = extraPages
      const retryFromPage = async(): Promise<boolean> => {
        if (!isStillActive()) return false
        const retried = await appendToActiveQueue(target, rawPageList, retryFromPage)
        if (retried === 'inactive' || retried === 'error') return false
        for (const item of rawPageList) playAllSeenIds.add(item.id)
        syncConsecutiveModalPage(target, retryPage.page, retryPage.limit, retryPage.total, retryPage.hasMore, rawPageList)
        await continuePlayAll(
          target,
          seq,
          listId,
          retryPage.page + 1,
          retryPage.limit,
          retryPage.hasMore,
          retryExtraPages,
          playAllSeenIds,
        )
        return true
      }
      const appendStatus = await appendToActiveQueue(target, rawPageList, retryFromPage)
      if (appendStatus === 'inactive' || appendStatus === 'error') break
      for (const item of rawPageList) playAllSeenIds.add(item.id)

      nextPage = pageData.page + 1
      limit = pageData.limit
      hasMore = pageData.hasMore
      syncConsecutiveModalPage(target, pageData.page, pageData.limit, pageData.total, pageData.hasMore, rawPageList)
    }
  }

  const playAt = async(index: number): Promise<boolean> => {
    const target = deps.state.target
    if (!target) return false
    const rawList = unwrapRawSongs(deps.state.list)
    const { started } = await startSnapshot(target, rawList, index, async() => playAt(index))
    return started
  }

  const playAll = async(): Promise<boolean> => {
    const target = deps.state.target
    if (!target || !deps.state.list.length) return false
    // 在首个 await 前冻结目标、首批曲目与分页游标，避免切目录污染
    const initialList = unwrapRawSongs(deps.state.list)
    const nextPage = deps.state.page + 1
    const limit = deps.state.limit
    const hasMore = deps.state.hasMore

    const { started, seq, listId } = await startSnapshot(target, initialList, 0, async() => playAll())
    if (!started) return false

    const playAllSeenIds = new Set(initialList.map(item => item.id))
    await continuePlayAll(target, seq, listId, nextPage, limit, hasMore, 0, playAllSeenIds)
    return true
  }

  const syncAppendedPage = (target: CatalogTarget, additions: LX.Music.MusicInfoOnline[]) => {
    void appendToActiveQueue(target, additions)
  }

  const retry = async(): Promise<{ handled: boolean, succeeded: boolean }> => {
    if (!lastFailedRetry || !isSameTarget(lastFailedRetry.target, deps.state.target)) {
      return { handled: false, succeeded: false }
    }
    const action = lastFailedRetry.action
    lastFailedRetry = null
    const succeeded = await action()
    return { handled: true, succeeded }
  }

  return {
    playAt,
    playAll,
    syncAppendedPage,
    retry,
    clearRetry,
  }
}
