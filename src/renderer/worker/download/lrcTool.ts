const timeFieldExp = /^(?:\[[\d:.]+\])+/g
const timeExp = /\d{1,3}(:\d{1,3}){0,2}(?:\.\d{1,3})/g

const t_rxp_1 = /^0+(\d+)/
const t_rxp_2 = /:0+(\d+)/g
const t_rxp_3 = /\.0+(\d+)/
const formatTimeLabel = (label: string) => {
  return label.replace(t_rxp_1, '$1')
    .replace(t_rxp_2, ':$1')
    .replace(t_rxp_3, '.$1')
}

const filterExtendedLyricLabel = (lrcTimeLabels: Set<string>, extendedLyric: string) => {
  const extendedLines = extendedLyric.split(/\r\n|\n|\r/)
  const lines: string[] = []
  for (let i = 0; i < extendedLines.length; i++) {
    let line = extendedLines[i].trim()
    let result = timeFieldExp.exec(line)
    if (!result) continue

    const timeField = result[0]
    const text = line.replace(timeFieldExp, '').trim()
    if (!text) continue
    let times = timeField.match(timeExp)
    if (times == null) continue

    const newTimes = times.filter(time => {
      const timeStr = formatTimeLabel(time)
      return lrcTimeLabels.has(timeStr)
    })
    if (newTimes.length != times.length) {
      if (!newTimes.length) continue
      line = `[${newTimes.join('][')}]${text}`
    }
    lines.push(line)
  }

  return lines.join('\n')
}

const parseLrcTimeLabel = (lrc: string) => {
  const lines = lrc.split(/\r\n|\n|\r/)
  const linesSet = new Set<string>()
  const length = lines.length
  for (let i = 0; i < length; i++) {
    const line = lines[i].trim()
    let result = timeFieldExp.exec(line)
    if (result) {
      const timeField = result[0]
      const text = line.replace(timeFieldExp, '').trim()
      if (text) {
        const times = timeField.match(timeExp)
        if (times == null) continue
        for (let time of times) {
          linesSet.add(formatTimeLabel(time))
        }
      }
    }
  }

  return linesSet
}


export const mergeLyrics = (lrc: string, tlrc: string | null, rlrc: string | null) => {
  if (!tlrc && !rlrc) return lrc

  const lrcTimeLabels = parseLrcTimeLabel(lrc)
  // console.log(lrcTimeLabels)
  if (tlrc) lrc += `\n\n${filterExtendedLyricLabel(lrcTimeLabels, tlrc)}\n`
  if (rlrc) lrc += `\n\n${filterExtendedLyricLabel(lrcTimeLabels, rlrc)}\n`
  // console.log(lrc)
  return lrc
}
