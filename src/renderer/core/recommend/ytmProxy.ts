/**
 * YouTube Music 有效代理配置解析（单源真值）：
 * 同时为 httpFetch 的 proxy 覆盖、缓存 proxyContext 隔离键和会话配置失效监听提供同一份结果，
 * 避免独立代理与全局/环境代理之间产生缓存串读或失效漏检。
 */

import { parseProxyAddress, type ProxyAddress } from '@common/utils/proxyAddress'

export type YtmProxyAddress = ProxyAddress
export { parseProxyAddress }

export interface YtmProxySettingSlice {
  'recommend.ytm.proxy.enable'?: boolean
  'recommend.ytm.proxy.host'?: string
  'recommend.ytm.proxy.port'?: string
  'network.proxy.enable'?: boolean
  'network.proxy.host'?: string
  'network.proxy.port'?: string
}

export interface GlobalProxyEnvSlice {
  enable?: boolean
  host?: string
  port?: string | number
  envProxy?: { host?: string, port?: string | number } | null
}

export interface EffectiveYtmProxy {
  /** 仅当启用独立代理且配置有效时传给 httpFetch 的显式覆盖；否则 undefined（沿用全局/环境代理）。 */
  proxyOverride: YtmProxyAddress | undefined
  /** 实际生效的出口代理（用于缓存键与失效判定，区分直连/全局代理/环境代理/独立代理）。 */
  effective: YtmProxyAddress | null
  /** 规范化代理上下文键（供缓存与可达性状态隔离）。 */
  contextKey: string
}

/**
 * 解析当前生效的 YouTube Music 代理配置：
 * 1) 开启 `recommend.ytm.proxy.enable` 且 host 非空 → 使用独立代理（`proxyOverride` 非空）；
 * 2) 否则若全局 `network.proxy.enable`（或 `globalProxy.enable`）且 host 非空 → 沿用全局代理；
 * 3) 否则若 `globalProxy.envProxy` 存在有效 host → 沿用环境代理；
 * 4) 否则直连（`contextKey = 'direct'`）。
 */
export const resolveEffectiveYtmProxy = (
  setting?: YtmProxySettingSlice | null,
  globalProxy?: GlobalProxyEnvSlice | null,
): EffectiveYtmProxy => {
  if (setting?.['recommend.ytm.proxy.enable']) {
    const dedicated = parseProxyAddress(setting['recommend.ytm.proxy.host'], setting['recommend.ytm.proxy.port'])
    if (dedicated) {
      return {
        proxyOverride: dedicated,
        effective: dedicated,
        contextKey: `dedicated:${dedicated.host}:${dedicated.port}`,
      }
    }
  }
  const globalEnabled = setting?.['network.proxy.enable'] ?? globalProxy?.enable ?? false
  if (globalEnabled) {
    const globalAddr = parseProxyAddress(
      setting?.['network.proxy.host'] ?? globalProxy?.host,
      setting?.['network.proxy.port'] ?? globalProxy?.port,
    )
    if (globalAddr) {
      return {
        proxyOverride: undefined,
        effective: globalAddr,
        contextKey: `global:${globalAddr.host}:${globalAddr.port}`,
      }
    }
  }
  const envAddr = globalProxy?.envProxy
    ? parseProxyAddress(globalProxy.envProxy.host, globalProxy.envProxy.port)
    : null
  if (envAddr) {
    return {
      proxyOverride: undefined,
      effective: envAddr,
      contextKey: `env:${envAddr.host}:${envAddr.port}`,
    }
  }
  return {
    proxyOverride: undefined,
    effective: null,
    contextKey: 'direct',
  }
}
