import { reactive } from '@renderer/utils/vueTools'

export const lyric = reactive({
  lines: [],
  text: '',
  line: 0,
  offset: 0, // 临时延迟
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
