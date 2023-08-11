import Lyric from '@common/utils/lyric-font-player'
import { markRawList } from '@common/utils/vueTools'
import { setLines, setOffset, setTempOffset, setText, lyrics } from '@lyric/store/lyric'
import { musicInfo, setting } from '@lyric/store/state'

let lrc: Lyric

export const init = () => {
  lrc = new Lyric({
    shadowContent: true,
    activeLineClassName: 'active',
    rate: setting['player.playbackRate'],
    isVertical: setting['desktopLyric.direction'] == 'vertical',
    onPlay(line, text) {
      setText(text, Math.max(line, 0))
      // console.log(line, text)
    },
    onSetLyric(lines, offset) { // listening lyrics seting event
      // console.log(lines) // lines is array of all lyric text
      setLines(markRawList([...lines]))
      setText(lines[0] ?? '', 0)
      setOffset(offset) // 歌词延迟
      setTempOffset(0) // 重置临时延迟
    },
    onUpdateLyric(lines) {
      setLines(markRawList([...lines]))
      setText(lines[0] ?? '', 0)
    },
  })
}

export const setLyricOffset = (offset: number) => {
  setTempOffset(offset)
  lrc.setOffset(offset)
}

export const setPlaybackRate = (rate: number) => {
  lrc.setPlaybackRate(rate)
}

export const setLyric = () => {
  if (!musicInfo.id) return
  const extendedLyrics = []
  if (setting['player.isShowLyricTranslation'] && lyrics.tlyric) extendedLyrics.push(lyrics.tlyric)
  if (setting['player.isShowLyricRoma'] && lyrics.rlyric) extendedLyrics.push(lyrics.rlyric)
  lrc.setLyric(
    setting['player.isPlayLxlrc'] && lyrics.lxlyric ? lyrics.lxlyric : lyrics.lyric,
    extendedLyrics,
  )
}


export const play = (time: number) => {
  if (!lyrics.lyric) return
  lrc.play(time)
}

export const pause = () => {
  lrc.pause()
}

export const stop = () => {
  lrc.setLyric('')
  // setLines([])
  setText('', 0)
}

export const setVertical = (isVertical: boolean) => {
  lrc.setVertical(isVertical)
}
