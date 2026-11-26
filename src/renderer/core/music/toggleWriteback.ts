import { getPreferredMusicInfo } from './version'
import { playMusicInfo } from '@renderer/store/player/state'

/** Record only this playback's actual resource. Saved identity and manual choice stay intact. */
export const writebackToggleMusicInfo = async(originalInfo: LX.Music.MusicInfo | LX.Download.ListItem, resolvedInfo: LX.Music.MusicInfoOnline) => {
  if (playMusicInfo.musicInfo !== originalInfo) return
  playMusicInfo.resolvedMusicInfo = resolvedInfo
  const preferred = getPreferredMusicInfo(originalInfo)
  // YTM 曲目经国内可播源桥接属于正常播放通路，不弹出异常风格的“临时切换版本”提示条
  playMusicInfo.versionNotice = (preferred.id === resolvedInfo.id || preferred.source === 'ytm')
    ? undefined
    : window.i18n.t('player__temporary_version_notice', { name: resolvedInfo.name, singer: resolvedInfo.singer, source: resolvedInfo.source })
}
