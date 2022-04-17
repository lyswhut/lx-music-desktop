import { onBeforeUnmount, watch, markRawList } from '@renderer/utils/vueTools'
import Lyric from '@renderer/utils/lyric-font-player'
import { getCurrentTime as getPlayerCurrentTime } from '@renderer/plugins/player'
import { setDesktopLyricInfo, onGetDesktopLyricInfo } from '@renderer/utils/tools'
import { player as eventPlayerNames } from '@renderer/event/names'
import { lyric, setText, setLines, setOffset, setTempOffset } from '@renderer/core/share/lyric'
import { musicInfo, setStatusText, isPlay, playMusicInfo } from '@renderer/core/share/player'

export default ({ setting }) => {
  const lrc = window.lrc = new Lyric({
    lineClassName: 'lrc-content',
    fontClassName: 'font',
    shadowContent: false,
    activeLineClassName: 'active',
    onPlay(line, text) {
      setText(text, line)
      setStatusText(text)
      // console.log(line, text)
    },
    onSetLyric(lines, offset) { // listening lyrics seting event
      // console.log(lines) // lines is array of all lyric text
      setLines(markRawList([...lines]))
      setText(lines[0] ?? '', 0)
      setOffset(offset) // 歌词延迟
      setTempOffset(0) // 重置临时延迟
    },
    // offset: 80,
  })

  const getCurrentTime = () => {
    return getPlayerCurrentTime() * 1000 + lyric.tempOffset
  }


  const setPlayInfo = ({ musicInfo }) => {
    setDesktopLyricInfo('music_info', {
      songmid: musicInfo.songmid,
      singer: musicInfo.singer,
      name: musicInfo.name,
      album: musicInfo.album,
    })
  }

  const setLyric = () => {
    if (!musicInfo.songmid) return
    lrc.setLyric(
      setting.value.player.isPlayLxlrc && musicInfo.lxlrc ? musicInfo.lxlrc : musicInfo.lrc,
      setting.value.player.isShowLyricTranslation && musicInfo.tlrc ? musicInfo.tlrc : '',
    )
    setDesktopLyricInfo('lyric', { lrc: musicInfo.lrc, tlrc: musicInfo.tlrc, lxlrc: musicInfo.lxlrc })

    if (isPlay.value && (musicInfo.url || playMusicInfo.listId == 'download')) {
      setTimeout(() => {
        const time = getCurrentTime()
        setDesktopLyricInfo('play', time)
        lrc.play(time)
      })
    }
  }

  const setLyricOffset = offset => {
    setTempOffset(offset)
    if (isPlay.value && (musicInfo.url || playMusicInfo.listId == 'download')) {
      setTimeout(() => {
        const time = getCurrentTime()
        setDesktopLyricInfo('play', time)
        lrc.play(time)
      })
    }
  }

  const handlePlay = () => {
    if (!musicInfo.lrc) return
    const currentTime = getCurrentTime()
    lrc.play(currentTime)
    setDesktopLyricInfo('play', currentTime)
  }
  const handlePause = () => {
    lrc.pause()
    setDesktopLyricInfo('pause')
  }
  const handleStop = () => {
    lrc.pause()
    setDesktopLyricInfo('stop')
    setLines([])
    setText('', 0)
  }

  watch(() => setting.value.player.isShowLyricTranslation, setLyric)
  watch(() => setting.value.player.isPlayLxlrc, setLyric)

  const rGetDesktopLyricInfo = onGetDesktopLyricInfo((event, info) => {
    switch (info.action) {
      case 'info':
        setDesktopLyricInfo('info', {
          songmid: musicInfo.songmid,
          singer: musicInfo.singer,
          name: musicInfo.name,
          album: musicInfo.album,
          lrc: musicInfo.lrc,
          tlrc: musicInfo.tlrc,
          lxlrc: musicInfo.lxlrc,
          isPlay: isPlay.value,
          line: lyric.line,
          played_time: getCurrentTime(),
        }, info)
        break
      case 'status':
        setDesktopLyricInfo('status', {
          isPlay: isPlay.value,
          line: lyric.line,
          played_time: getCurrentTime(),
        }, info)
        break

      default:
        break
    }
  })


  window.eventHub.on(eventPlayerNames.play, handlePlay)
  window.eventHub.on(eventPlayerNames.pause, handlePause)
  window.eventHub.on(eventPlayerNames.stop, handleStop)
  window.eventHub.on(eventPlayerNames.error, handlePause)
  window.eventHub.on(eventPlayerNames.setPlayInfo, setPlayInfo)
  window.eventHub.on(eventPlayerNames.updateLyric, setLyric)
  window.eventHub.on(eventPlayerNames.updateLyricOffset, setLyricOffset)

  onBeforeUnmount(() => {
    rGetDesktopLyricInfo()
    window.eventHub.off(eventPlayerNames.play, handlePlay)
    window.eventHub.off(eventPlayerNames.pause, handlePause)
    window.eventHub.off(eventPlayerNames.stop, handleStop)
    window.eventHub.off(eventPlayerNames.error, handlePause)
    window.eventHub.off(eventPlayerNames.setPlayInfo, setPlayInfo)
    window.eventHub.off(eventPlayerNames.updateLyric, setLyric)
    window.eventHub.off(eventPlayerNames.updateLyricOffset, setLyricOffset)
  })
}
