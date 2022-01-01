import { onBeforeUnmount, watch, markRawList } from '@renderer/utils/vueTools'
import Lyric from '@renderer/utils/lyric-font-player'
import { getCurrentTime } from '@renderer/plugins/player'
import { setDesktopLyricInfo, onGetDesktopLyricInfo } from '@renderer/utils/tools'
import { player } from '@renderer/event/names'
import { lyric, setText, setLines } from '@renderer/core/share/lyric'
import { musicInfo, setStatusText, isPlay, playMusicInfo } from '@renderer/core/share/player'

export default ({ setting }) => {
  const lrc = window.lrc = new Lyric({
    lineClassName: 'lrc-content',
    fontClassName: 'font',
    shadowContent: false,
    activeLineClassName: 'active',
    onPlay: (line, text) => {
      setText(text, line)
      setStatusText(text)
      // console.log(line, text)
    },
    onSetLyric: lines => { // listening lyrics seting event
      // console.log(lines) // lines is array of all lyric text
      setLines(markRawList([...lines]))
      setText(lines[0] ?? '', 0)
    },
    // offset: 80,
  })


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
      const time = getCurrentTime() * 1000
      setDesktopLyricInfo('play', time)
      lrc.play(time)
    }
  }

  const handlePlay = () => {
    if (!musicInfo.lrc) return
    const currentTime = getCurrentTime() * 1000
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
          played_time: getCurrentTime() * 1000,
        }, info)
        break
      case 'status':
        setDesktopLyricInfo('status', {
          isPlay: isPlay.value,
          line: lyric.line,
          played_time: getCurrentTime() * 1000,
        }, info)
        break

      default:
        break
    }
  })


  window.eventHub.on(player.play, handlePlay)
  window.eventHub.on(player.pause, handlePause)
  window.eventHub.on(player.stop, handleStop)
  window.eventHub.on(player.error, handlePause)
  window.eventHub.on(player.setPlayInfo, setPlayInfo)
  window.eventHub.on(player.updateLyric, setLyric)

  onBeforeUnmount(() => {
    rGetDesktopLyricInfo()
    window.eventHub.off(player.play, handlePlay)
    window.eventHub.off(player.pause, handlePause)
    window.eventHub.off(player.stop, handleStop)
    window.eventHub.off(player.error, handlePause)
    window.eventHub.off(player.setPlayInfo, setPlayInfo)
    window.eventHub.off(player.updateLyric, setLyric)
  })
}
