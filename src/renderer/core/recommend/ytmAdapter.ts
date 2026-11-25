/**
 * YouTube Music InnerTube 网络传输适配器。
 *
 * 职责：
 * - 复用项目既有 httpFetch + proxyOverride（独立代理不影响国内音源）；
 * - 严格校验 HTTP statusCode === 200 及 InnerTube 顶层结构，非 200（429/503）或畸形 200 均抛错，
 *   绝不把错误页当作成功空页覆写/清空分页游标；
 * - 每次调用均返回带 cancel() 的 CancellablePromise，便于共享截止时间与会话取消即时中止。
 */

import { YTM_CONNECTION_TEST_TIMEOUT_MS, YTM_REQUEST_TIMEOUT_MS } from '@common/recommendationConfig'
import { httpFetch } from '@renderer/utils/request'
import { MusicSdkResponseError } from '@renderer/utils/musicSdk/responseError'
import {
  isValidInnerTubePayload,
  isYtmRegionBlockedError,
  isYtmRegionBlockedHtml,
  parseYtmNextRadio,
  parseYtmRelatedSongs,
  parseYtmSearchSongs,
  YtmRegionBlockedError,
  type ParsedYtmRadioPage,
  type YtmRawTrack,
} from './ytmParser'
import type { YtmProxyAddress } from './ytmProxy'

export { isYtmRegionBlockedError, YtmRegionBlockedError }

export type YtmCancellablePromise<T> = Promise<T> & {
  cancel?: () => void
  cancelHttp?: () => void
}

export interface YtmAdapter {
  searchSongs: (query: string, timeoutMs?: number) => YtmCancellablePromise<YtmRawTrack[]>
  getRadio: (videoId: string, timeoutMs?: number) => YtmCancellablePromise<ParsedYtmRadioPage>
  getRadioContinuation: (videoId: string, continuation: string, timeoutMs?: number) => YtmCancellablePromise<ParsedYtmRadioPage>
  getRelated: (browseId: string, seedVideoId?: string | null, timeoutMs?: number) => YtmCancellablePromise<YtmRawTrack[]>
  checkRegionBlocked: (timeoutMs?: number) => YtmCancellablePromise<boolean>
}

export interface YtmConnectionTestResult {
  ok: boolean
  status: 'ok' | 'region-blocked' | 'error'
  message: string
}

/** 构造携带 HTTP 状态码的 MusicSdkResponseError 实例（保证 instanceof MusicSdkResponseError 且满足 Error 约束）。 */
const createHttpStatusError = (statusCode: number): Error => {
  const err = new MusicSdkResponseError() as Error & { statusCode?: number }
  err.message = `YouTube Music HTTP ${statusCode}`
  err.statusCode = statusCode
  return err
}

const YTM_BASE = 'https://music.youtube.com/youtubei/v1'
const YTM_SONGS_FILTER_PARAMS = 'EgWKAQIIAWoKEAkQBRAKEAMQBA=='
const YTM_CLIENT = {
  clientName: 'WEB_REMIX',
  clientVersion: '1.20250101.01.00',
  hl: 'zh-CN',
  gl: 'US',
}
const YTM_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Origin: 'https://music.youtube.com',
  Referer: 'https://music.youtube.com/',
  Cookie: 'SOCS=CAI',
}

const attachCancel = <T>(promise: Promise<T>, cancel: () => void): YtmCancellablePromise<T> => {
  const wrapped = promise as YtmCancellablePromise<T>
  wrapped.cancel = cancel
  return wrapped
}

const rawHttpFetch = httpFetch as unknown as (
  url: string,
  options?: Record<string, unknown>,
) => {
  promise: Promise<{ statusCode: number, body: unknown }>
  cancelHttp?: () => void
}

const postInnerTube = (
  endpoint: 'search' | 'next' | 'browse',
  payload: Record<string, unknown>,
  proxyOverride: YtmProxyAddress | undefined,
  timeoutMs: number,
): YtmCancellablePromise<Record<string, any>> => {
  const safeTimeout = Math.max(1000, timeoutMs)
  const reqObj = rawHttpFetch(`${YTM_BASE}/${endpoint}?prettyPrint=false`, {
    method: 'post',
    compressed: true,
    timeout: safeTimeout,
    open_timeout: safeTimeout,
    read_timeout: safeTimeout,
    headers: YTM_HEADERS,
    body: {
      context: { client: YTM_CLIENT },
      ...payload,
    },
    ...(proxyOverride ? { proxy: proxyOverride } : {}),
  })
  const promise = reqObj.promise.then(({ statusCode, body }: { statusCode: number, body: unknown }) => {
    if (isYtmRegionBlockedHtml(body)) {
      throw new YtmRegionBlockedError()
    }
    if (statusCode !== 200) {
      throw createHttpStatusError(statusCode)
    }
    if (!isValidInnerTubePayload(body)) {
      throw new MusicSdkResponseError()
    }
    return body
  })
  return attachCancel(promise, () => reqObj.cancelHttp?.())
}

/** 创建绑定特定代理配置的 YouTube Music 适配器实例。 */
export const createYtmAdapter = (proxyOverride?: YtmProxyAddress): YtmAdapter => {
  /* eslint-disable @typescript-eslint/promise-function-async -- 适配器返回带 .cancel() 的同步包装 Promise */
  return {
    searchSongs(query: string, timeoutMs: number = YTM_REQUEST_TIMEOUT_MS) {
      const req = postInnerTube('search', { query, params: YTM_SONGS_FILTER_PARAMS }, proxyOverride, timeoutMs)
      return attachCancel(
        req.then(body => {
          const parsed = parseYtmSearchSongs(body)
          if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
          return parsed.tracks
        }),
        () => req.cancel?.(),
      )
    },

    getRadio(videoId: string, timeoutMs: number = YTM_REQUEST_TIMEOUT_MS) {
      const req = postInnerTube('next', {
        videoId,
        playlistId: `RDAMVM${videoId}`,
        isAudioOnly: true,
        enablePersistentPlaylistPanel: true,
      }, proxyOverride, timeoutMs)
      return attachCancel(
        req.then(body => {
          const parsed = parseYtmNextRadio(body, videoId, { isContinuation: false })
          if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
          return parsed
        }),
        () => req.cancel?.(),
      )
    },

    getRadioContinuation(videoId: string, continuation: string, timeoutMs: number = YTM_REQUEST_TIMEOUT_MS) {
      const req = postInnerTube('next', {
        continuation,
        playlistId: `RDAMVM${videoId}`,
        isAudioOnly: true,
        enablePersistentPlaylistPanel: true,
      }, proxyOverride, timeoutMs)
      return attachCancel(
        req.then(body => {
          const parsed = parseYtmNextRadio(body, videoId, { isContinuation: true })
          if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
          return parsed
        }),
        () => req.cancel?.(),
      )
    },

    getRelated(browseId: string, seedVideoId?: string | null, timeoutMs: number = YTM_REQUEST_TIMEOUT_MS) {
      const req = postInnerTube('browse', { browseId }, proxyOverride, timeoutMs)
      return attachCancel(
        req.then(body => {
          const parsed = parseYtmRelatedSongs(body, seedVideoId)
          if (!parsed.hasValidContainer) throw new MusicSdkResponseError()
          return parsed.tracks
        }),
        () => req.cancel?.(),
      )
    },

    checkRegionBlocked(timeoutMs: number = YTM_REQUEST_TIMEOUT_MS) {
      const safeTimeout = Math.max(1000, timeoutMs)
      const reqObj = rawHttpFetch('https://music.youtube.com/', {
        method: 'get',
        format: 'text',
        compressed: true,
        timeout: safeTimeout,
        open_timeout: safeTimeout,
        read_timeout: safeTimeout,
        follow_max: 3,
        follow_set_cookies: true,
        headers: {
          'User-Agent': YTM_HEADERS['User-Agent'],
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          Cookie: 'SOCS=CAI',
        },
        ...(proxyOverride ? { proxy: proxyOverride } : {}),
      })
      const promise = reqObj.promise.then(({ statusCode, body }: { statusCode: number, body: unknown }) => {
        if (isYtmRegionBlockedHtml(body)) return true
        if (statusCode >= 400) throw createHttpStatusError(statusCode)
        return false
      })
      return attachCancel(promise, () => reqObj.cancelHttp?.())
    },
  }
  /* eslint-enable @typescript-eslint/promise-function-async */
}

/** 设置页「测试 YouTube Music 连通性」：并行执行地区探测与目录搜索，共享总截止时间并在早退/超时时立即取消残留请求。 */
export const testYtmConnection = async(
  proxyOverride?: YtmProxyAddress,
  timeoutMs: number = YTM_CONNECTION_TEST_TIMEOUT_MS,
): Promise<YtmConnectionTestResult> => {
  const adapter = createYtmAdapter(proxyOverride)
  const totalBudget = Math.max(100, timeoutMs)
  const regionReq = adapter.checkRegionBlocked(totalBudget)
  const searchReq = adapter.searchSongs('Blinding Lights The Weeknd', totalBudget)
  const cancelAll = () => {
    try {
      regionReq.cancel?.()
      regionReq.cancelHttp?.()
    } catch {}
    try {
      searchReq.cancel?.()
      searchReq.cancelHttp?.()
    } catch {}
  }
  // 防止提前取消 sibling 请求后产生未捕获 rejection
  regionReq.catch(() => {})
  searchReq.catch(() => {})

  return new Promise<YtmConnectionTestResult>((resolve) => {
    let settled = false
    let regionDone = false
    let regionBlocked = false
    let regionErr: unknown = null
    let searchDone = false
    let searchTracks: YtmRawTrack[] = []
    let searchErr: unknown = null
    let firstErr: unknown = null

    const finish = (result: YtmConnectionTestResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      cancelAll()
      resolve(result)
    }

    const tryResolve = () => {
      if (settled) return
      if (regionDone && regionBlocked) {
        finish({
          ok: false,
          status: 'region-blocked',
          message: 'YouTube Music is not available in your area',
        })
        return
      }
      if ((regionDone && isYtmRegionBlockedError(regionErr)) || (searchDone && isYtmRegionBlockedError(searchErr))) {
        const err = isYtmRegionBlockedError(regionErr) ? regionErr : searchErr
        finish({
          ok: false,
          status: 'region-blocked',
          message: (err as Error).message,
        })
        return
      }
      if (!regionDone || !searchDone) return
      const err = firstErr ?? regionErr ?? searchErr
      if (err != null) {
        finish({
          ok: false,
          status: 'error',
          message: String((err as Error)?.message ?? err).slice(0, 200),
        })
        return
      }
      if (searchTracks.length > 0) {
        finish({ ok: true, status: 'ok', message: '' })
        return
      }
      // 主页正常但搜索返回合法空结果：明确按 error 汇报而非误报地区受限
      finish({
        ok: false,
        status: 'error',
        message: 'Empty YouTube Music catalog response',
      })
    }

    const timer = setTimeout(() => {
      const priorErr = firstErr ?? regionErr ?? searchErr
      finish({
        ok: false,
        status: 'error',
        message: priorErr != null
          ? String((priorErr as Error)?.message ?? priorErr).slice(0, 200)
          : `YouTube Music 连接测试超时(${totalBudget}ms)`,
      })
    }, totalBudget)

    regionReq.then(
      blocked => {
        regionDone = true
        regionBlocked = blocked
        tryResolve()
      },
      err => {
        regionDone = true
        regionErr = err
        firstErr ??= err
        tryResolve()
      },
    )
    searchReq.then(
      tracks => {
        searchDone = true
        searchTracks = tracks
        tryResolve()
      },
      err => {
        searchDone = true
        searchErr = err
        firstErr ??= err
        tryResolve()
      },
    )
  })
}
