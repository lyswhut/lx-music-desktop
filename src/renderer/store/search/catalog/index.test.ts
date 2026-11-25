import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { requestMsg } from '@renderer/utils/message'
import { createI18n } from '../../../../lang'
import {
  createCatalogSearchStore,
  type CatalogSearchKind,
  type CatalogSearchPageResult,
} from './index'

vi.mock('@renderer/utils/musicSdk', () => ({ default: {} }))

beforeEach(() => {
  const i18n = createI18n()
  i18n.setLanguage('zh-cn')
  vi.stubGlobal('window', { i18n })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('search/catalog store (artist & album search)', () => {
  it('聚合搜索合并多源结果、按关键词相似度排序，且单源失败时保留成功源并提示可读源名', async() => {
    const providers: Record<CatalogSearchKind, Partial<Record<LX.OnlineSource, any>>> = {
      artist: {
        tx: vi.fn(async(): Promise<CatalogSearchPageResult> => ({
          source: 'tx',
          limit: 20,
          total: 10,
          list: [
            { id: 'tx-other', name: '周杰伦模仿者', img: '', source: 'tx', songCount: 2, albumCount: 1 },
            { id: 'tx-jay', name: '周杰伦', img: 'https://img/jay.jpg', source: 'tx', songCount: 500, albumCount: 40 },
          ],
        })),
        wy: vi.fn(async(): Promise<CatalogSearchPageResult> => {
          throw new Error('network error')
        }),
      },
      album: {},
    }

    const store = createCatalogSearchStore(
      (kind, source) => providers[kind]?.[source] ?? null,
      ['tx', 'wy'],
    )

    const list = await store.search('artist', '周杰伦', 1, 'all')
    expect(list.map(x => x.id)).toEqual(['tx-jay', 'tx-other'])
    const info = store.getListInfo('artist', 'all')!
    expect(info.total).toBe(10)
    expect(info.error).toContain('网易云音乐')
    expect(info.noItemLabel).toBe('')
  })

  it('新搜索发起时取消同槽位在途请求并忽略过期响应', async() => {
    const cancelFirst = vi.fn()
    let resolveFirst!: (val: CatalogSearchPageResult) => void
    const firstPromise = Object.assign(
      new Promise<CatalogSearchPageResult>(resolve => { resolveFirst = resolve }),
      { cancel: cancelFirst },
    )
    const secondPromise = Promise.resolve<CatalogSearchPageResult>({
      source: 'wy',
      limit: 20,
      total: 1,
      list: [{ id: 2, name: '叶惠美', singer: '周杰伦', img: '', source: 'wy', publishTime: '2003-07-31', songCount: 11 }],
    })

    const albumSearch = vi.fn()
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise)

    const store = createCatalogSearchStore(
      (kind, source) => (kind === 'album' && source === 'wy' ? albumSearch : null),
      ['wy'],
    )

    const p1 = store.search('album', '范特西', 1, 'wy')
    const p2 = store.search('album', '叶惠美', 1, 'wy')
    expect(cancelFirst).toHaveBeenCalledTimes(1)

    await p2
    resolveFirst({
      source: 'wy',
      limit: 20,
      total: 1,
      list: [{ id: 1, name: '范特西', singer: '周杰伦', img: '', source: 'wy' }],
    })
    await p1

    const info = store.getListInfo('album', 'wy')!
    expect(info.list.map(x => x.name)).toEqual(['叶惠美'])
  })

  it('全部来源失败时展示错误且重试可恢复', async() => {
    const albumSearch = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        source: 'kw',
        limit: 20,
        total: 1,
        list: [{ id: '1287', name: '范特西', singer: '周杰伦', img: '', source: 'kw', songCount: 10 }],
      })

    const store = createCatalogSearchStore(
      (kind, source) => (kind === 'album' && source === 'kw' ? albumSearch : null),
      ['kw'],
    )

    await store.search('album', '范特西', 1, 'kw')
    expect(store.getListInfo('album', 'kw')!.error).toBeTruthy()
    expect(store.getListInfo('album', 'kw')!.list).toEqual([])

    const retried = await store.search('album', '范特西', 1, 'kw')
    expect(retried.map(x => x.name)).toEqual(['范特西'])
    expect(store.getListInfo('album', 'kw')!.error).toBe('')
  })

  it('page > 1 返回空列表时显示空状态且不伪造 total，支持 cancel 中止在途请求并遵循 sourceNameType', async() => {
    const cancelSpy = vi.fn()
    let resolvePending!: (val: CatalogSearchPageResult) => void
    const pendingPromise = Object.assign(
      new Promise<CatalogSearchPageResult>(resolve => { resolvePending = resolve }),
      { cancel: cancelSpy },
    )
    const emptyPageSearch = vi.fn()
      .mockResolvedValueOnce({ source: 'tx', limit: 20, total: 2, list: [] })
      .mockReturnValueOnce(pendingPromise)

    const store = createCatalogSearchStore(
      (kind, source) => (kind === 'album' && source === 'tx' ? emptyPageSearch : null),
      ['tx'],
    )

    await store.search('album', '范特西', 3, 'tx')
    const info = store.getListInfo('album', 'tx')!
    expect(info.total).toBe(2)
    expect(info.noItemLabel).toBe(window.i18n.t('no_item'))

    const inflight = store.search('album', '新专辑', 1, 'tx')
    store.cancel('album', 'tx')
    expect(cancelSpy).toHaveBeenCalledTimes(1)
    expect(info.noItemLabel).toBe('')
    resolvePending({
      source: 'tx',
      limit: 20,
      total: 1,
      list: [{ id: 'stale', name: '过期专辑', img: '', source: 'tx' }],
    })
    await inflight
    expect(info.list).toEqual([])

    // 验证 alias 模式下的失败来源标签
    ;(window as any).lxData = { appSetting: { 'common.sourceNameType': 'alias' } }
    const storeAlias = createCatalogSearchStore(
      (kind, source) => {
        if (kind !== 'artist') return null
        if (source === 'tx') return async() => ({ source: 'tx', limit: 20, total: 1, list: [{ id: '1', name: 'A', img: '', source: 'tx' }] })
        return async() => { throw new Error('boom') }
      },
      ['tx', 'wy'],
    )
    await storeAlias.search('artist', 'A', 1, 'all')
    expect(storeAlias.getListInfo('artist', 'all')!.error).toContain(window.i18n.t('source_alias_wy'))

    // httpFetch 中文取消消息（requestMsg.cancelRequest）应识别为 cancelled 而非失败源
    const storeCancelMsg = createCatalogSearchStore(
      (kind, source) => {
        if (kind !== 'artist') return null
        if (source === 'tx') return async() => ({ source: 'tx', limit: 20, total: 1, list: [{ id: '1', name: 'A', img: '', source: 'tx' }] })
        return async() => { throw new Error(requestMsg.cancelRequest) }
      },
      ['tx', 'wy'],
    )
    await storeCancelMsg.search('artist', 'A', 1, 'all')
    expect(storeCancelMsg.getListInfo('artist', 'all')!.error).toBe('')
    expect(storeCancelMsg.getListInfo('artist', 'all')!.key).toBeNull()
  })
})
