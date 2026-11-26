/**
 * YouTube Music 纯流辅助常量与 URL 过期校验（零 DOM / 零网络 / 零 store 依赖）。
 */

/** 内置 YouTube Music 原生引擎支持的音质档位（128k: AAC/M4A；320k: 最高码率 Opus/AAC）。 */
export const BUILTIN_YTM_QUALITIES: LX.Quality[] = ['128k', '320k']

/** YouTube googlevideo 签名直链提前 5 分钟视为过期，避免缓存命中 403。 */
const YTM_STREAM_EXPIRE_BUFFER_SEC = 300

/** 判断 URL 是否为已过期或即将过期的 YouTube googlevideo 签名流地址。 */
export const isYtmStreamUrlExpired = (
  rawUrl?: string | null,
  nowMs: number = Date.now(),
  bufferSec: number = YTM_STREAM_EXPIRE_BUFFER_SEC,
): boolean => {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }
  const host = parsed.hostname.toLowerCase()
  if (!/(^|\.)googlevideo\.com$/.test(host)) return false
  const expireRaw = parsed.searchParams.get('expire')
  if (!expireRaw || !/^\d+$/.test(expireRaw)) return true
  const expireSec = Number(expireRaw)
  if (!Number.isFinite(expireSec) || expireSec <= 0) return true
  const nowSec = Math.floor(nowMs / 1000)
  return expireSec - nowSec <= bufferSec
}
