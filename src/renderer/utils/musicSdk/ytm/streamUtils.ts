/**
 * YouTube Music 纯流辅助常量与 URL 过期校验（零 DOM / 零网络 / 零 store 依赖）。
 */

/** 内置 YouTube Music 原生引擎支持的音质档位（128k: AAC/M4A；320k: 最高码率 Opus/AAC）。 */
export const BUILTIN_YTM_QUALITIES: LX.Quality[] = ['128k', '320k']

/** YouTube googlevideo 签名直链提前 5 分钟视为过期，避免缓存命中 403。 */
const YTM_STREAM_EXPIRE_BUFFER_SEC = 300

/**
 * 判断 URL 是否为已过期、即将过期或已知被 YouTube GVS PO Token 拦截（开放 Range 返回 403）的流地址。
 * 旧缓存中无 `pot` 参数的 IOS / ANDROID 非渐进式音频流（如 itag 140/251）会自动视为失效并刷新。
 */
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
  if (expireSec - nowSec <= bufferSec) return true

  // 无 pot 的 IOS/ANDROID 非渐进式音频流（itag 140/251）开放 Range 会触发 GVS 403，
  // 主动视为过期以自愈历史缓存（若极少数曲目经 IOS_VERIFIED 兜底播放，重播会重验而非误复用坏链）。
  const client = (parsed.searchParams.get('c') ?? '').trim().toUpperCase()
  const itag = (parsed.searchParams.get('itag') ?? '').trim()
  const hasPot = Boolean(parsed.searchParams.get('pot')?.trim())
  if ((client === 'IOS' || client === 'ANDROID') && !hasPot && itag !== '18' && itag !== '22') {
    return true
  }
  return false
}
