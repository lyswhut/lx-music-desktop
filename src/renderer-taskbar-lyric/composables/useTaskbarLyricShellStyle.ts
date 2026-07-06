import { computed } from 'vue'
import { state } from '../store/state'

interface RGB {
  r: number
  g: number
  b: number
}

const lyricState = state as LX.TaskbarLyric.State

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const parseRgb = (color: string | null | undefined): RGB | null => {
  if (!color) return null
  const value = color.trim()
  if (!value) return null

  const hex = value.replace(/^#/, '')
  if (/^[\da-f]{3}$/i.test(hex)) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    }
  }
  if (/^[\da-f]{6}$/i.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    }
  }

  const match = value.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/i)
  if (!match) return null

  return {
    r: clamp(Math.round(Number(match[1])), 0, 255),
    g: clamp(Math.round(Number(match[2])), 0, 255),
    b: clamp(Math.round(Number(match[3])), 0, 255),
  }
}

const toRgbString = (color: RGB) => `rgb(${color.r}, ${color.g}, ${color.b})`
const withAlpha = (color: RGB, alpha: number) => `rgba(${color.r}, ${color.g}, ${color.b}, ${clamp(alpha, 0, 1)})`

const mix = (colorA: RGB, colorB: RGB, weight: number): RGB => {
  const ratio = clamp(weight, 0, 1)
  const remain = 1 - ratio
  return {
    r: Math.round(colorA.r * remain + colorB.r * ratio),
    g: Math.round(colorA.g * remain + colorB.g * ratio),
    b: Math.round(colorA.b * remain + colorB.b * ratio),
  }
}

const getLuminance = ({ r, g, b }: RGB) => {
  const normalize = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  const red = normalize(r)
  const green = normalize(g)
  const blue = normalize(b)
  return red * 0.2126 + green * 0.7152 + blue * 0.0722
}

const getContrastRatio = (foreground: RGB, background: RGB) => {
  const [lighter, darker] = [getLuminance(foreground), getLuminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

const getReadableTextColor = (background: RGB) => {
  const lightText = { r: 248, g: 250, b: 252 }
  const darkText = { r: 15, g: 23, b: 42 }
  return getContrastRatio(lightText, background) >= getContrastRatio(darkText, background)
    ? lightText
    : darkText
}

export const useTaskbarLyricShellStyle = () => {
  const shellStyle = computed(() => {
    const backgroundOpacity = clamp((lyricState.backgroundOpacity ?? 72) / 100, 0, 1)
    const themeColor = parseRgb(lyricState.themeColor) ?? { r: 77, g: 175, b: 124 }
    const isLightTheme = getLuminance(themeColor) > 0.58
    const isCustomSongInfoFontMode = lyricState.songInfoFontColorMode === 'custom'
    const isCustomLyricFontMode = lyricState.lyricFontColorMode === 'custom'

    const backgroundBase = lyricState.backgroundColorMode === 'custom'
      ? parseRgb(lyricState.backgroundColor) ?? themeColor
      : isLightTheme
        ? mix(themeColor, { r: 255, g: 255, b: 255 }, 0.82)
        : mix(themeColor, { r: 15, g: 23, b: 42 }, 0.72)

    const backgroundStrong = lyricState.backgroundColorMode === 'custom'
      ? backgroundBase
      : isLightTheme
        ? mix(themeColor, { r: 255, g: 255, b: 255 }, 0.72)
        : mix(themeColor, { r: 30, g: 41, b: 59 }, 0.6)

    const defaultLyricText = getReadableTextColor(backgroundBase)
    const defaultSongInfoText = mix(defaultLyricText, backgroundBase, 0.34)
    const lyricText = isCustomLyricFontMode
      ? parseRgb(lyricState.lyricFontColor) ?? defaultLyricText
      : defaultLyricText
    const songInfoText = isCustomSongInfoFontMode
      ? parseRgb(lyricState.songInfoFontColor) ?? defaultSongInfoText
      : defaultSongInfoText

    const borderColor = mix(lyricText, backgroundBase, 0.76)
    const borderOpacity = backgroundOpacity * 0.26

    return {
      '--taskbar-lyric-bg': withAlpha(backgroundBase, backgroundOpacity),
      '--taskbar-lyric-bg-strong': withAlpha(backgroundStrong, backgroundOpacity),
      '--taskbar-lyric-border': withAlpha(borderColor, borderOpacity),
      '--taskbar-lyric-drag-border': withAlpha(lyricText, 0.95),
      '--taskbar-lyric-text': toRgbString(lyricText),
      '--taskbar-lyric-text-secondary': toRgbString(songInfoText),
      '--taskbar-lyric-song-info-font-size': `${clamp(lyricState.songInfoFontSize ?? 11, 9, 18)}px`,
      '--taskbar-lyric-line-font-size': `${clamp(lyricState.lyricFontSize ?? 12, 10, 22)}px`,
    }
  })

  return {
    shellStyle,
  }
}
