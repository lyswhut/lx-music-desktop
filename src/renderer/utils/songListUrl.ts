/**
 * 从“打开歌单”弹窗的输入内容中识别平台歌单链接的音源与歌单 id
 *
 * 各音源可识别的链接形式与 musicSdk/<source>/songList.js 的入口能力保持一致，
 * 避免自动识别出 SDK 无法打开的链接形式。
 */

import { extractYtmListParam, isUnsupportedYtmMixId, normalizeYtmPlaylistId } from '@renderer/utils/musicSdk/ytm/parser'

export interface ParsedSongListUrl {
  source: LX.OnlineSource
  id: string
}

// 各音源歌单网页域名
const sourceHostRegExps: Array<{ source: LX.OnlineSource, regExp: RegExp }> = [
  { source: 'tx', regExp: /(^|\.)y\.qq\.com$/ },
  { source: 'kg', regExp: /(^|\.)kugou\.com$/ },
  { source: 'kw', regExp: /(^|\.)kuwo\.cn$/ },
  { source: 'wy', regExp: /(^|\.)music\.163\.com$/ },
  { source: 'mg', regExp: /(^|\.)migu\.cn$/ },
  { source: 'ytm', regExp: /(^|\.)(?:youtube\.com|youtu\.be)$/ },
]

// 与 src/renderer/utils/musicSdk/wy/songList.js 的 regExps.listDetailLink / listDetailLink2 保持一致
const wyRegExps = [
  /^.+(?:\?|&)id=(\d+)(?:&.*$|#.*$|$)/i,
  /^.+\/playlist\/(\d+)\/\d+\/.+$/i,
]
// 与 src/renderer/utils/musicSdk/tx/songList.js 的 regExps.listDetailLink / listDetailLink2 保持一致
const txRegExps = [
  /\/playlist\/(\d+)/i,
  /id=(\d+)/i,
]
// 与 src/renderer/utils/musicSdk/kg/songList.js 的 special/single 解析保持一致。
const kgRegExp = /^.+\/(\d+)\.html(?:\?.*|&.*$|#.*$|$)/i
// 酷狗用户歌单还支持 gcid/chain/zlist/songlist 等链接，SDK 会在 getUserListDetail
// 内部继续解析或跟随跳转；这些场景必须保留原 URL，而不能强行提取不存在的纯数字 id。
const kgUserListRegExp = /(?:gcid_|(?:global_collection_id|chain)=|zlist\.html|\/songlist\/)/i
// 与 src/renderer/utils/musicSdk/kw/songList.js 的 regExps.listDetailLink 保持一致
const kwRegExp = /^.+\/playlist(?:_detail)?\/(\d+)(?:\?.*|&.*$|#.*$|$)/i
// 与 src/renderer/utils/musicSdk/mg/songList.js 的 regExps.listDetailLink 及 getListDetail 中的链接解析保持一致
const mgQueryRegExp = /(?:playlistId|id)=(\d+)/i
const mgRegExp = /^.+\/playlist\/(\d+)(?:\?.*|&.*$|#.*$|$)/i

const parseIdBySource: Record<LX.OnlineSource, (url: string) => string | null> = {
  wy: url => wyRegExps[0].exec(url)?.[1] ?? wyRegExps[1].exec(url)?.[1] ?? null,
  tx: url => txRegExps[0].exec(url)?.[1] ?? txRegExps[1].exec(url)?.[1] ?? null,
  kg: url => {
    if (/special\/single\//i.test(url)) return kgRegExp.exec(url)?.[1] ?? null
    return kgUserListRegExp.test(url) ? url : null
  },
  kw: url => kwRegExp.exec(url)?.[1] ?? null,
  mg: url => {
    if (/\/playlist[/?]/i.test(url)) {
      const result = mgQueryRegExp.exec(url)
      if (result) return result[1]
    }
    return mgRegExp.exec(url)?.[1] ?? null
  },
  ytm: url => {
    const listParam = extractYtmListParam(url)
    return listParam ? normalizeYtmPlaylistId(listParam) : null
  },
}

/** 识别明确属于 YouTube / YouTube Music 链接但为不可浏览自动混音（如 `list=RD...`）或缺少有效 list 参数的输入。 */
export const isUnsupportedYtmPlaylistUrl = (input: string, allowBareId = true): boolean => {
  const value = input.trim()
  if (!value) return false
  const explicitUrl = value.match(/https?:\/\/[^\s]+/i)?.[0]
  if (explicitUrl) {
    const urlText = explicitUrl.replace(/[.,;!?'"()（\u4e00-\u9fff，。；：！？、）】》'’”]+$/, '')
    try {
      const url = new URL(urlText)
      const host = url.hostname.toLowerCase()
      if (!/(^|\.)(?:youtube\.com|youtu\.be)$/.test(host)) return false
      const list = url.searchParams.get('list')?.trim() ?? ''
      if (!list) return true
      return normalizeYtmPlaylistId(list) == null
    } catch {
      return false
    }
  }
  if (!/\s/.test(value) && value.includes('/')) {
    const urlText = value.replace(/[.,;!?'"()（\u4e00-\u9fff，。；：！？、）】》'’”]+$/, '')
    try {
      const url = new URL(`https://${urlText}`)
      const host = url.hostname.toLowerCase()
      if (/(^|\.)(?:youtube\.com|youtu\.be)$/.test(host)) {
        const list = url.searchParams.get('list')?.trim() ?? ''
        if (!list) return true
        return normalizeYtmPlaylistId(list) == null
      }
      return false
    } catch {
      return false
    }
  }
  return allowBareId ? isUnsupportedYtmMixId(value) : false
}

/**
 * 解析歌单链接
 * @param input 用户输入内容，可能为歌单链接或分享文字附带链接
 * @returns 解析成功返回音源与 SDK 可接受的歌单 id/URL，否则返回 null
 */
export const parseSongListUrl = (input: string): ParsedSongListUrl | null => {
  const value = input.trim()
  if (!value) return null
  // 支持网易云“我喜欢”歌单的“[id|url]###token”形式（FAQ.md 已文档化）：token 仅用于登录校验，不参与链接解析
  const urlPart = value.split('###')[0].trim()
  // 纯数字 id（含“id###token”形式）与无效输入不识别
  if (!urlPart || /^\d+$/.test(urlPart)) return null
  // 分享文字的粘贴内容可能附带说明文字，取其中的第一个链接
  const urlText = (urlPart.match(/https?:\/\/[^\s]+/i)?.[0] ?? urlPart)
    // 去除链接末尾混入的标点与中文等非链接内容
    .replace(/[.,;!?'"()（\u4e00-\u9fff，。；：！？、）】》'’”]+$/, '')
  if (!urlText) return null
  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(urlText) ? urlText : `https://${urlText}`)
  } catch {
    return null
  }
  const hostname = url.hostname.toLowerCase()
  for (const { source, regExp } of sourceHostRegExps) {
    if (!regExp.test(hostname)) continue
    const id = parseIdBySource[source](urlText)
    return id ? { source, id } : null
  }
  return null
}
