// 迷你窗歌词解析：兼容普通 LRC（逐行）与落雪转换的逐字歌词（lxlrc）
// 逐字格式：[mm:ss.xxx]<相对行首开始时间,持续时间>歌词片段
// 解析逻辑参考 src/common/utils/lyric-font-player 的实现

export interface LyricWord {
  text: string
  time: number // 相对行首的开始时间（ms）
  duration: number // 持续时间（ms）
}

export interface LyricLine {
  time: number // 该行开始时间（ms，绝对）
  text: string // 纯文本
  words: LyricWord[] | null // null 表示逐行歌词
}

export interface ParsedLyric {
  isWordMode: boolean // 是否逐字模式
  lines: LyricLine[]
}

// 行首时间字段，如 [00:12.345]，可能连续多个
const timeFieldExp = /^(\[\d{1,3}(?::\d{1,3}){1,2}(?:\.\d{1,3})?\])+/
// 单个时间标签
const timeLabelExp = /\[(\d{1,3}):(\d{1,3})(?:\.(\d{1,3}))?\]/g
// 逐字片段切分
const wordSplitExp = /(?=<\d+,\d+>).*?/g
// 单个逐字时间戳
const wordTimeExp = /<(\d+),(\d+)>/
// 判断行内是否含逐字时间戳
const hasWordExp = /<\d+,\d+>/

// 将 mm:ss(.xxx) 时间标签转换为毫秒
const timeLabelToMs = (label: string): number => {
  timeLabelExp.lastIndex = 0
  const parts = [...label.matchAll(timeLabelExp)]
  if (!parts.length) return 0
  const [, m, s, ms] = parts[0]
  return parseInt(m) * 60 * 1000 + parseInt(s) * 1000 + parseInt((ms ?? '0').padEnd(3, '0'))
}

// 解析一行的逐字片段，失败（存在无时间戳文本）则返回 null
const parseWords = (text: string): LyricWord[] | null => {
  const chunks = text.split(wordSplitExp).filter(Boolean)
  if (!chunks.length) return null
  const words: LyricWord[] = []
  for (const chunk of chunks) {
    const match = chunk.match(wordTimeExp)
    if (!match) return null
    words.push({
      text: chunk.replace(wordTimeExp, ''),
      time: parseInt(match[1]),
      duration: parseInt(match[2]),
    })
  }
  return words.length ? words : null
}

/**
 * 解析歌词原文
 */
export const parseLyric = (rawLyric: string): ParsedLyric => {
  const lines: LyricLine[] = []
  const rawLines = rawLyric.split(/\r\n|\r|\n/)

  for (const rawLine of rawLines) {
    const line = rawLine.trim()
    const field = line.match(timeFieldExp)?.[0]
    if (!field) continue
    const content = line.replace(timeFieldExp, '').trim()
    if (!content) continue
    const words = hasWordExp.test(content) ? parseWords(content) : null
    lines.push({
      time: timeLabelToMs(field),
      text: words ? words.map(w => w.text).join('') : content,
      words,
    })
  }

  lines.sort((a, b) => a.time - b.time)
  // 存在成功解析出逐字片段的行即视为逐字歌词
  const isWordMode = lines.some(line => line.words != null)
  return { isWordMode, lines }
}

/**
 * 根据当前播放时间（ms）查找所在行索引，无匹配（如前奏）返回 -1
 */
export const findCurrentLineIndex = (lines: LyricLine[], curMs: number): number => {
  if (!lines.length) return -1
  for (let i = 0; i < lines.length; i++) {
    if (curMs < lines[i].time) return i - 1
  }
  return lines.length - 1
}

/**
 * 根据相对行首时间（ms）查找当前唱到的字索引
 */
export const findCurrentWordIndex = (words: LyricWord[], relMs: number): number => {
  for (let i = 0; i < words.length; i++) {
    if (relMs < words[i].time + words[i].duration) return i
  }
  return words.length - 1
}

/**
 * 计算某个字内部的演唱进度（0~1）
 */
export const getWordPlayedRatio = (word: LyricWord, relMs: number): number => {
  if (word.duration <= 0) return 1
  return Math.min(Math.max((relMs - word.time) / word.duration, 0), 1)
}
