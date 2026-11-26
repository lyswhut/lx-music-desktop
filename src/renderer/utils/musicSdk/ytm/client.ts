/**
 * YouTube Music InnerTube 底层传输与实时代理上下文解析（供 SDK 与 Explore 共用）。
 */

import { YTM_REQUEST_TIMEOUT_MS } from '@common/recommendationConfig'
import { httpFetch } from '@renderer/utils/request'
import { MusicSdkResponseError } from '@renderer/utils/musicSdk/responseError'
import type { YtmProxyAddress } from '@renderer/core/recommend/ytmProxy'
import { isValidInnerTubePayload, isYtmRegionBlockedHtml, YtmRegionBlockedError } from './parser'
import { sharedYtmRegionCache } from './regionCache'
import type { YtmCancellablePromise } from './paginationCache'
export {
  getLiveYtmContextKey,
  isYtmAggregateSearchEnabled,
  resolveLiveYtmProxy,
  setYtmRuntimeContext,
  type LiveYtmProxyContext,
  type YtmRuntimeContextProvider,
} from './runtimeContext'

export type YtmHttpProxyOption = YtmProxyAddress | false | undefined

export const YTM_BASE = 'https://music.youtube.com/youtubei/v1'

export const YTM_SEARCH_PARAMS = {
  songs: 'EgWKAQIIAWoKEAkQBRAKEAMQBA==',
  artists: 'EgWKAQIgAWoKEAkQBRAKEAMQBA==',
  albums: 'EgWKAQIYAWoKEAkQBRAKEAMQBA==',
  communityPlaylists: 'EgeKAQQoAEABagoQAxAEEAkQBRAK',
  featuredPlaylists: 'EgeKAQQoADgBagoQAxAEEAkQBRAK',
} as const

export const YTM_CLIENT = {
  clientName: 'WEB_REMIX',
  clientVersion: '1.20250101.01.00',
  hl: 'zh-CN',
  gl: 'US',
}

export const YTM_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Origin: 'https://music.youtube.com',
  Referer: 'https://music.youtube.com/',
  Cookie: 'SOCS=CAI',
}

export const YTM_ANDROID_CLIENT = {
  clientName: 'ANDROID',
  clientVersion: '21.02.35',
  hl: 'zh-CN',
  gl: 'US',
  osName: 'Android',
  osVersion: '15',
  androidSdkVersion: 35,
}

export const YTM_ANDROID_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'com.google.android.youtube/21.02.35 (Linux; U; Android 15) gzip',
}

export const YTM_ANDROID_FALLBACK_CLIENT = {
  clientName: 'ANDROID',
  clientVersion: '20.10.38',
  hl: 'zh-CN',
  gl: 'US',
  osName: 'Android',
  osVersion: '14',
  androidSdkVersion: 34,
}

export const YTM_ANDROID_FALLBACK_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip',
}

export const YTM_IOS_CLIENT = {
  clientName: 'IOS',
  clientVersion: '20.10.4',
  hl: 'zh-CN',
  gl: 'US',
  deviceMake: 'Apple',
  deviceModel: 'iPhone16,2',
  osName: 'iPhone',
  osVersion: '18.3.2.22D82',
}

export const YTM_IOS_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)',
}

export const YTM_ANDROID_MUSIC_CLIENT = {
  clientName: 'ANDROID_MUSIC',
  clientVersion: '8.05.51',
  hl: 'zh-CN',
  gl: 'US',
  osName: 'Android',
  osVersion: '14',
  androidSdkVersion: 34,
}

export const YTM_ANDROID_MUSIC_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'com.google.android.apps.youtube.music/8.05.51 (Linux; U; Android 14) gzip',
}

export type YtmInnerTubeEndpoint = 'search' | 'next' | 'browse' | 'player' | 'music/get_search_suggestions'

export interface PostInnerTubeClientOptions {
  client?: Record<string, unknown>
  contextExtra?: Record<string, unknown>
  headers?: Record<string, string>
  proxyOption: YtmHttpProxyOption
  timeoutMs?: number
  contextKey?: string
}

export const attachCancel = <T>(promise: Promise<T>, cancel: () => void): YtmCancellablePromise<T> => {
  const wrapped = promise as YtmCancellablePromise<T>
  wrapped.cancel = cancel
  return wrapped
}

export const createYtmHttpStatusError = (statusCode: number): Error => {
  const err = new MusicSdkResponseError() as Error & { statusCode?: number }
  err.message = `YouTube Music HTTP ${statusCode}`
  err.statusCode = statusCode
  return err
}

const rawHttpFetch = httpFetch as unknown as (
  url: string,
  options?: Record<string, unknown>,
) => {
  promise: Promise<{ statusCode: number, body: unknown }>
  cancelHttp?: () => void
}

export const markYtmContextReachable = (contextKey?: string): void => {
  if (contextKey) sharedYtmRegionCache.set(contextKey, false)
}

export const postInnerTubeWithClient = (
  endpoint: YtmInnerTubeEndpoint,
  payload: Record<string, unknown>,
  options: PostInnerTubeClientOptions,
): YtmCancellablePromise<Record<string, any>> => {
  const safeTimeout = Math.max(1000, options.timeoutMs ?? YTM_REQUEST_TIMEOUT_MS)
  const reqObj = rawHttpFetch(`${YTM_BASE}/${endpoint}?prettyPrint=false`, {
    method: 'post',
    compressed: true,
    timeout: safeTimeout,
    open_timeout: safeTimeout,
    read_timeout: safeTimeout,
    headers: options.headers ?? YTM_HEADERS,
    body: {
      context: {
        client: options.client ?? YTM_CLIENT,
        ...(options.contextExtra ?? {}),
      },
      ...payload,
    },
    ...(options.proxyOption !== undefined ? { proxy: options.proxyOption } : {}),
  })
  const promise = reqObj.promise.then(({ statusCode, body }: { statusCode: number, body: unknown }) => {
    if (isYtmRegionBlockedHtml(body)) {
      if (options.contextKey) sharedYtmRegionCache.set(options.contextKey, true)
      throw new YtmRegionBlockedError()
    }
    if (statusCode !== 200) {
      throw createYtmHttpStatusError(statusCode)
    }
    if (!isValidInnerTubePayload(body)) {
      throw new MusicSdkResponseError()
    }
    // 仅由下游确认解析出有效业务内容（或显式地区探测/连通性测试）后标记可达，避免地区受限空壳/无效容器抹除受限缓存
    return body
  })
  return attachCancel(promise, () => reqObj.cancelHttp?.())
}

export const postInnerTube = (
  endpoint: YtmInnerTubeEndpoint,
  payload: Record<string, unknown>,
  proxyOption: YtmHttpProxyOption,
  timeoutMs: number = YTM_REQUEST_TIMEOUT_MS,
  contextKey?: string,
): YtmCancellablePromise<Record<string, any>> => {
  return postInnerTubeWithClient(endpoint, payload, {
    proxyOption,
    timeoutMs,
    contextKey,
  })
}
