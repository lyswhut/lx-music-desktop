/**
 * YouTube Music 运行时上下文读取器（无 DOM / 无 store 静态依赖）：
 * 由 `@renderer/store` 初始化时注入响应式 `appSetting` 与 `proxy`，
 * 使 `utils/musicSdk/ytm` 及各搜索/歌单/榜单 store 在单测与运行时均无循环依赖。
 */

import {
  resolveEffectiveYtmProxy,
  type EffectiveYtmProxy,
  type GlobalProxyEnvSlice,
  type YtmProxyAddress,
  type YtmProxySettingSlice,
} from '@renderer/core/recommend/ytmProxy'
import { sharedYtmRegionCache } from './regionCache'

export interface YtmRuntimeSettingLike extends YtmProxySettingSlice {
  'recommend.ytm.enable'?: boolean
}

export interface YtmRuntimeContextProvider {
  getAppSetting: () => YtmRuntimeSettingLike | null | undefined
  getProxy: () => GlobalProxyEnvSlice | null | undefined
}

export interface LiveYtmProxyContext extends EffectiveYtmProxy {
  /** 锁定单次请求或整条续页链的明确代理出口（直连为 false，绝不随全局设置漂移）。 */
  lockedProxy: YtmProxyAddress | false
}

let runtimeProvider: YtmRuntimeContextProvider | null = null

export const setYtmRuntimeContext = (provider: YtmRuntimeContextProvider | null): void => {
  runtimeProvider = provider
}

const getAppSettingSnapshot = (): YtmRuntimeSettingLike => {
  if (runtimeProvider) return runtimeProvider.getAppSetting() ?? {}
  if (typeof window !== 'undefined') {
    const win = window as unknown as { lxData?: { appSetting?: YtmRuntimeSettingLike } }
    if (win.lxData?.appSetting) return win.lxData.appSetting
  }
  return {}
}

const getProxySnapshot = (): GlobalProxyEnvSlice | undefined => {
  return runtimeProvider?.getProxy() ?? undefined
}

/** 实时解析当前 YTM 有效代理配置（传入完整 `proxy` store 以与 Explore `session.ts` 保持同口径）。 */
export const resolveLiveYtmProxy = (): LiveYtmProxyContext => {
  const resolved = resolveEffectiveYtmProxy(getAppSettingSnapshot(), getProxySnapshot())
  return {
    ...resolved,
    lockedProxy: resolved.effective ?? false,
  }
}

/** 聚合搜索（all）是否纳入 YTM：需启用 `recommend.ytm.enable` 且当前出口未缓存为地区受限。 */
export const isYtmAggregateSearchEnabled = (contextKey?: string): boolean => {
  const setting = getAppSettingSnapshot()
  if (setting['recommend.ytm.enable'] === false) return false
  const key = contextKey ?? resolveLiveYtmProxy().contextKey
  return sharedYtmRegionCache.get(key) !== true
}

export const getLiveYtmContextKey = (): string => resolveLiveYtmProxy().contextKey
