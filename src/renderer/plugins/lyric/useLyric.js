import { useRefGetter, reactive, computed, watch, useCommit } from '@renderer/utils/vueTools'
import Lyric from '@renderer/utils/lyric-font-player'
import { getCurrentTime } from '@renderer/plugins/player'
import { setDesktopLyricInfo } from '@renderer/utils/tools'

// let lrc = window.lrc

export default ({ setting, musicInfo, isPlay, listId, setStatusText }) => {
  const lyric = reactive({
    lines: [],
    text: '',
    line: 0,
  })

  const lrc = window.lrc = new Lyric({
    lineClassName: 'lrc-content',
    fontClassName: 'font',
    shadowContent: false,
    activeLineClassName: 'active',
    onPlay: (line, text) => {
      lyric.text = text
      lyric.line = line
      setStatusText(text)
      // console.log(line, text)
    },
    onSetLyric: lines => { // listening lyrics seting event
      // console.log(lines) // lines is array of all lyric text
      lyric.lines = lines
      lyric.line = 0
    },
    // offset: 80,
  })


  const setLyric = () => {
    lrc.setLyric(
      setting.value.player.isPlayLxlrc && musicInfo.value.lxlrc ? musicInfo.vlaue.lxlrc : musicInfo.vlaue.lrc,
      setting.value.player.isShowLyricTranslation && musicInfo.value.tlrc ? musicInfo.value.tlrc : '',
    )
    if (isPlay.value && (musicInfo.value.url || listId.value == 'download')) {
      const time = getCurrentTime() * 1000
      setDesktopLyricInfo('play', time)
      lrc.play(time)
    }
  }
  watch(setting.value.player.isShowLyricTranslation, setLyric)
  watch(setting.value.player.isPlayLxlrc, setLyric)
}
