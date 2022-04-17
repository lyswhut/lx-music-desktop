import { reactive } from '@renderer/utils/vueTools'

export const lyric = reactive({
  lines: [],
  text: '',
  line: 0,
  offset: 0, // 歌词延迟
  tempOffset: 0, // 歌词临时延迟
})

export const setLines = lines => {
  lyric.lines = lines
}
export const setText = (text, line) => {
  lyric.text = text
  lyric.line = line
}
export const setOffset = offset => {
  lyric.offset = offset
}
export const setTempOffset = offset => {
  lyric.tempOffset = offset
}
