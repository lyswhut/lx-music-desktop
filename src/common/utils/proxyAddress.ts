/**
 * 规范化 HTTP 代理地址解析（主进程与渲染进程共享单源真值）：
 * - 拒绝非 HTTP 代理协议（https:// / socks://）、凭据、路径与冲突端口；
 * - 正确解析裸 IPv6（如 `::1`）与方括号 IPv6（如 `[::1]:7890`），返回不带括号的纯 host 与 1..65535 端口。
 */

export interface ProxyAddress {
  host: string
  port: number
}

export const parseProxyAddress = (host?: string | null, port?: string | number | null): ProxyAddress | null => {
  const rawHost = String(host ?? '').trim()
  if (!rawHost || /\s/.test(rawHost)) return null
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(rawHost) && !/^http:\/\//i.test(rawHost)) return null

  const withoutScheme = rawHost.replace(/^http:\/\//i, '')
  const normalizedInput = /^http:\/\//i.test(rawHost)
    ? rawHost
    : `http://${/^[^[\]]*:[^[\]]*:/.test(withoutScheme) ? `[${withoutScheme}]` : withoutScheme}`

  let parsedUrl: URL
  try {
    parsedUrl = new URL(normalizedInput)
  } catch {
    return null
  }
  if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) return null
  if (parsedUrl.pathname && !/^\/+$/.test(parsedUrl.pathname)) return null

  const cleanHost = parsedUrl.hostname.replace(/^\[|\]$/g, '')
  if (!cleanHost) return null

  // 从原始 authority 提取显式端口，避免 WHATWG URL 抹除默认端口 80/443
  const authority = withoutScheme.replace(/\/+$/, '')
  const portMatch = authority.startsWith('[')
    ? /^\[[^\]]+\]:(\d+)$/.exec(authority)
    : /^[^/:]+:(\d+)$/.exec(authority)
  const embeddedPort = portMatch ? portMatch[1] : parsedUrl.port

  const rawPort = String(port ?? '').trim()
  if (rawPort && !/^\d+$/.test(rawPort)) return null
  if (embeddedPort && rawPort && Number(embeddedPort) !== Number(rawPort)) return null

  const chosenPort = rawPort || embeddedPort
  if (!chosenPort || !/^\d+$/.test(chosenPort)) return null
  const parsedPort = Number(chosenPort)
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) return null
  return { host: cleanHost, port: parsedPort }
}
