import { reactive } from '@renderer/utils/vueTools'

export const lyric = reactive({
  lines: [],
  text: '',
  line: 0,
})

export const setLines = lines => {
  lyric.lines = lines
}
export const setText = (text, line) => {
  lyric.text = text
  lyric.line = line
}
