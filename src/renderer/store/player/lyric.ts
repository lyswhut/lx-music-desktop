import { reactive } from '@common/utils/vueTools'

interface Line {
  text: string
  time: number
  extendedLyrics: string[]
  dom_line: HTMLDivElement
}

export const lyric = reactive<{
  lines: Line[]
  text: string
  line: number
  offset: number // 歌词延迟
  tempOffset: number // 歌词临时延迟
}>({
  lines: [],
  text: '',
  line: 0,
  offset: 0, // 歌词延迟
  tempOffset: 0, // 歌词临时延迟
})

export const setLines = (lines: Line[]) => {
  if (!lines.length && !lyric.lines.length) return
  lyric.lines = lines
}
export const setText = (text: string, line: number) => {
  lyric.text = text
  lyric.line = line
}
export const setOffset = (offset: number) => {
  lyric.offset = offset
}
export const setTempOffset = (offset: number) => {
  lyric.tempOffset = offset
}
