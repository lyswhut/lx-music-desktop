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

const buildAwlyric = (lrcData: LX.Music.LyricInfo) => {
  let lrc: string[] = []
  if (lrcData.lyric) {
    lrc.push(`lrc:${Buffer.from(lrcData.lyric.trim(), 'utf-8').toString('base64')}`)
  }
  if (lrcData.tlyric) {
    lrc.push(`tlrc:${Buffer.from(lrcData.tlyric.trim(), 'utf-8').toString('base64')}`)
  }
  if (lrcData.rlyric) {
    lrc.push(`rlrc:${Buffer.from(lrcData.rlyric.trim(), 'utf-8').toString('base64')}`)
  }
  if (lrcData.lxlyric) {
    lrc.push(`awlrc:${Buffer.from(lrcData.lxlyric.trim(), 'utf-8').toString('base64')}`)
  }
  return lrc.length ? `[awlrc:${lrc.join(',')}]` : ''
}

export const buildLyrics = (lrcData: LX.Music.LyricInfo, downloadAwlrc: boolean, downloadTlrc: boolean, downloadRlrc: boolean) => {
  if (!lrcData.tlyric && !lrcData.rlyric && !lrcData.lxlyric) return lrcData.lyric

  const lrcTimeLabels = parseLrcTimeLabel(lrcData.lyric)

  let lrc = lrcData.lyric
  if (downloadTlrc && lrcData.tlyric) {
    lrc = lrc.trim() + `\n\n${filterExtendedLyricLabel(lrcTimeLabels, lrcData.tlyric)}\n`
  }
  if (downloadRlrc && lrcData.rlyric) {
    lrc = lrc.trim() + `\n\n${filterExtendedLyricLabel(lrcTimeLabels, lrcData.rlyric)}\n`
  }
  if (downloadAwlrc) {
    const awlrc = buildAwlyric(lrcData)
    if (awlrc) lrc = lrc.trim() + `\n\n${awlrc}\n`
  }
  return lrc
}
