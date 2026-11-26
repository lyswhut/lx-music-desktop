/**
 * 兼容导出入口：YouTube Music InnerTube 纯解析原语已统一收敛至 `@renderer/utils/musicSdk/ytm/parser`，
 * 消除双解析器漂移与层级倒置。
 */

export {
  isValidInnerTubePayload,
  isYtmRegionBlockedError,
  isYtmRegionBlockedHtml,
  parseYtmNextRadio,
  parseYtmRelatedSongs,
  parseYtmSearchSongs,
  simplifyForMatch,
  YtmRegionBlockedError,
  type ParsedYtmRadioPage,
  type RankedYtmTrack,
  type YtmRawTrack,
} from '@renderer/utils/musicSdk/ytm/parser'
