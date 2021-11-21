<template lang="pug">
div(:class="$style.player")
  div(:class="$style.left" @contextmenu="handleToMusicLocation" @click="showPlayerDetail" :tips="$t('core.player.pic_tip')")
    img(v-if="musicInfo.img" :src="musicInfo.img" @error="imgError")
    svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='102%' width='100%' viewBox='0 0 60 60' space='preserve')
      use(:xlink:href='`#${$style.iconPic}`')
  div(:class="$style.middle")
    div(:class="$style.middleContainer")
      div(:class="$style.column1")
        div(:class="$style.container")
          div(:class="$style.title" @click="handleCopy(title)" :tips="title + $t('core.player.copy_title')") {{title}}
          div(:class="$style.controlBtn")

            div(:class="$style.volumeContent")
              div(:class="[$style.volume, setting.player.isMute ? $style.muted : null]")
                div(:class="$style.volumeBar" :style="{ transform: `scaleX(${volume || 0})` }")
              div(:class="$style.volumeMask" @mousedown="handleVolumeMsDown" ref="dom_volumeMask" :tips="`${$t('core.player.volume')}${parseInt(volume * 100)}%`")
            div(:class="$style.titleBtn" @click='toggleDesktopLyric' @contextmenu="handleToggleLockDesktopLyric" :tips="toggleDesktopLyricBtnTitle")
              svg(v-if="setting.desktopLyric.enable" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 512 512' space='preserve')
                use(xlink:href='#icon-desktop-lyric-on')
              svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 512 512' space='preserve')
                use(xlink:href='#icon-desktop-lyric-off')
            div(:class="$style.titleBtn" @click='toggleNextPlayMode' :tips="nextTogglePlayName")
              svg(v-if="setting.player.togglePlayMethod == 'listLoop'" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='80%' viewBox='0 0 24 24' space='preserve')
                use(xlink:href='#icon-list-loop')
              svg(v-else-if="setting.player.togglePlayMethod == 'random'" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
                use(xlink:href='#icon-list-random')
              svg(v-else-if="setting.player.togglePlayMethod == 'list'" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='120%' viewBox='0 0 24 24' space='preserve')
                use(xlink:href='#icon-list-order')
              svg(v-else-if="setting.player.togglePlayMethod == 'singleLoop'" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
                use(xlink:href='#icon-single-loop')
              svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='120%' viewBox='0 0 24 24' space='preserve')
                use(xlink:href='#icon-single')
            div(:class="$style.titleBtn" @click='addMusicTo' :tips="$t('core.player.add_music_to')")
              svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='80%' viewBox='0 0 512 512' space='preserve')
                use(xlink:href='#icon-add-2')
          //- div(:class="$style.playBtn" @click='playNext' tips="音量")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 291.063 291.064' space='preserve')
              use(xlink:href='#icon-sound')

      div(:class="$style.column2")
        div(:class="$style.progress" v-if="!isShowPlayerDetail")
          //- div(:class="[$style.progressBar, $style.progressBar1]" :style="{ transform: `scaleX(${progress || 0})` }")
          div(:class="[$style.progressBar, $style.progressBar2, isActiveTransition ? $style.barTransition : '']"
            @transitionend="handleTransitionEnd" :style="{ transform: `scaleX(${progress || 0})` }")
        div(:class="$style.progressMask" @click='handleSetProgress' ref="dom_progress")
      div(:class="$style.column3")
        span(:class="$style.statusText") {{statusText}}
        span {{nowPlayTimeStr}}
        span(style="margin: 0 5px;") /
        span {{maxPlayTimeStr}}
  div(:class="$style.right")
    div(:class="$style.playBtn" @click='playPrev' :tips="$t('core.player.prev')" style="transform: rotate(180deg);")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 220.847 220.847' space='preserve')
        use(xlink:href='#icon-nextMusic')
    div(:class="$style.playBtn" :tips="isPlay ? $t('core.player.pause') : $t('core.player.play')" @click='togglePlay')
      svg(v-if="isPlay" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 277.338 277.338' space='preserve')
        use(xlink:href='#icon-pause')
      svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 170 170' space='preserve')
        use(xlink:href='#icon-play')
    div(:class="$style.playBtn" @click='playNext' :tips="$t('core.player.next')")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 220.847 220.847' space='preserve')
        use(xlink:href='#icon-nextMusic')
  //- transition(enter-active-class="animated lightSpeedIn"
  transition(enter-active-class="animated lightSpeedIn"
      leave-active-class="animated slideOutDown")
    core-player-detail(v-if="isShowPlayerDetail" :visible.sync="isShowPlayerDetail" :musicInfo="currentMusicInfo"
                      :lyric="lyric" :list="list" :listId="listId"
                      :playInfo="{ nowPlayTimeStr, maxPlayTimeStr, progress, nowPlayTime, status }"
                      :isPlay="isPlay" @action="handlePlayDetailAction"
                      :nextTogglePlayName="nextTogglePlayName"
                      @toggle-next-play-mode="toggleNextPlayMode" @add-music-to="addMusicTo")

  material-list-add-modal(:show="isShowAddMusicTo" :musicInfo="currentMusicInfo" @close="isShowAddMusicTo = false")
  svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' style="display: none;")
    defs
      g(:id="$style.iconPic")
        path(d='M29,0C12.984,0,0,12.984,0,29c0,16.016,12.984,29,29,29s29-12.984,29-29C58,12.984,45.016,0,29,0zM29,36.08c-3.91,0-7.08-3.17-7.08-7.08c0-3.91,3.17-7.08,7.08-7.08s7.08,3.17,7.08,7.08C36.08,32.91,32.91,36.08,29,36.08z')
        path(:class="$style.c1" d='M6.487,22.932c-0.077,0-0.156-0.009-0.234-0.027c-0.537-0.13-0.868-0.67-0.739-1.206c0.946-3.935,2.955-7.522,5.809-10.376s6.441-4.862,10.376-5.809c0.536-0.127,1.077,0.202,1.206,0.739c0.129,0.536-0.202,1.076-0.739,1.206c-3.575,0.859-6.836,2.685-9.429,5.277s-4.418,5.854-5.277,9.429C7.349,22.624,6.938,22.932,6.487,22.932z')
        path(:class="$style.c1" d='M36.066,52.514c-0.451,0-0.861-0.308-0.972-0.767c-0.129-0.536,0.202-1.076,0.739-1.206c3.576-0.859,6.837-2.685,9.43-5.277s4.418-5.854,5.277-9.429c0.129-0.538,0.668-0.868,1.206-0.739c0.537,0.13,0.868,0.67,0.739,1.206c-0.946,3.935-2.955,7.522-5.809,10.376s-6.441,4.862-10.377,5.809C36.223,52.505,36.144,52.514,36.066,52.514z')
        path(:class="$style.c1" d='M11.313,24.226c-0.075,0-0.151-0.008-0.228-0.026c-0.538-0.125-0.873-0.663-0.747-1.2c0.72-3.09,2.282-5.904,4.52-8.141c2.236-2.237,5.051-3.8,8.141-4.52c0.535-0.131,1.075,0.209,1.2,0.747c0.126,0.537-0.209,1.075-0.747,1.2c-2.725,0.635-5.207,2.014-7.18,3.986s-3.352,4.455-3.986,7.18C12.179,23.914,11.768,24.226,11.313,24.226z')
        path(:class="$style.c1" d='M34.773,47.688c-0.454,0-0.865-0.312-0.973-0.773c-0.126-0.537,0.209-1.075,0.747-1.2c2.725-0.635,5.207-2.014,7.18-3.986s3.352-4.455,3.986-7.18c0.125-0.538,0.662-0.88,1.2-0.747c0.538,0.125,0.873,0.663,0.747,1.2c-0.72,3.09-2.282,5.904-4.52,8.141c-2.236,2.237-5.051,3.8-8.141,4.52C34.925,47.68,34.849,47.688,34.773,47.688z')
        path(:class="$style.c1" d='M16.14,25.519c-0.071,0-0.143-0.008-0.215-0.023c-0.539-0.118-0.881-0.651-0.763-1.19c0.997-4.557,4.586-8.146,9.143-9.143c0.537-0.116,1.071,0.222,1.19,0.763c0.118,0.539-0.224,1.072-0.763,1.19c-3.796,0.831-6.786,3.821-7.617,7.617C17.013,25.2,16.6,25.519,16.14,25.519z')
        path(:class="$style.c1" d='M33.48,42.861c-0.46,0-0.873-0.318-0.976-0.786c-0.118-0.539,0.224-1.072,0.763-1.19c3.796-0.831,6.786-3.821,7.617-7.617c0.118-0.541,0.65-0.881,1.19-0.763c0.539,0.118,0.881,0.651,0.763,1.19c-0.997,4.557-4.586,8.146-9.143,9.143C33.623,42.854,33.552,42.861,33.48,42.861z')
        path(:class="$style.c2" d='M29,38.08c-5.007,0-9.08-4.073-9.08-9.08s4.073-9.08,9.08-9.08s9.08,4.073,9.08,9.08S34.007,38.08,29,38.08z M29,23.92c-2.801,0-5.08,2.279-5.08,5.08s2.279,5.08,5.08,5.08s5.08-2.279,5.08-5.08S31.801,23.92,29,23.92z')
</template>

<script>
import Lyric from '@renderer/utils/lyric-font-player'
import { rendererSend, rendererOn, NAMES, rendererInvoke } from '../../../common/ipc'
import { formatPlayTime2, getRandom, checkPath, setTitle, clipboardWriteText, debounce, throttle, assertApiSupport } from '../../utils'
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { requestMsg } from '../../utils/message'
import { player as eventPlayerNames } from '../../../common/hotKey'
import path from 'path'

let audio

const playNextModes = [
  'listLoop',
  'random',
  'list',
  'singleLoop',
]

export default {
  data() {
    return {
      volume: 0,
      nowPlayTime: 0,
      maxPlayTime: 0,
      isPlay: false,
      status: '',
      statusText: '',
      musicInfo: {
        songmid: null,
        img: null,
        lrc: null,
        url: null,
        name: '',
        singer: '',
        album: '',
      },
      currentMusicInfo: {},
      pregessWidth: 0,
      lyric: {
        lines: [],
        text: '',
        line: 0,
      },
      delayNextTimeout: null,
      restorePlayTime: 0,
      retryNum: 0,
      volumeEvent: {
        isMsDown: false,
        msDownX: 0,
        msDownVolume: 0,
      },
      isActiveTransition: false,
      mediaBuffer: {
        timeout: null,
        playTime: 0,
      },
      isShowAddMusicTo: false,
      isShowPlayerDetail: false,
    }
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('player', ['list', 'changePlay', 'playMusicInfo', 'playInfo', 'playedList']),
    // pic() {
    //   return this.musicInfo.img ? this.musicInfo.img : ''
    // },
    listId() { // 当前播放歌曲的列表ID
      return this.playInfo.listId
    },
    playIndex() { // 当前播放歌曲所在列表的 播放列表的播放位置
      return this.playInfo.playIndex
    },
    targetSong() {
      return this.playInfo.musicInfo
    },
    title() {
      return this.musicInfo.name
        ? this.setting.download.fileName.replace('歌名', this.musicInfo.name).replace('歌手', this.musicInfo.singer)
        : '^-^'
    },
    nowPlayTimeStr() {
      return this.nowPlayTime ? formatPlayTime2(this.nowPlayTime) : '00:00'
    },
    maxPlayTimeStr() {
      return this.maxPlayTime ? formatPlayTime2(this.maxPlayTime) : '00:00'
    },
    progress() {
      return this.nowPlayTime / this.maxPlayTime || 0
    },
    nextTogglePlayName() {
      switch (this.setting.player.togglePlayMethod) {
        case 'listLoop': return this.$t('core.player.play_toggle_mode_list_loop')
        case 'random': return this.$t('core.player.play_toggle_mode_random')
        case 'singleLoop': return this.$t('core.player.play_toggle_mode_single_loop')
        case 'list': return this.$t('core.player.play_toggle_mode_list')
        default: return this.$t('core.player.play_toggle_mode_off')
      }
    },
    toggleDesktopLyricBtnTitle() {
      return `${
        this.setting.desktopLyric.enable
          ? this.$t('core.player.desktop_lyric_off')
          : this.$t('core.player.desktop_lyric_on')
      }（${
        this.setting.desktopLyric.isLock
          ? this.$t('core.player.desktop_lyric_unlock')
          : this.$t('core.player.desktop_lyric_lock')
      }）`
    },
  },
  mounted() {
    this.init()
    this.$nextTick(() => {
      this.setProgressWidth()
    })
    this.handleSaveVolume = debounce(volume => {
      this.setVolume(volume)
    }, 300)
    this.savePlayInfo = throttle(n => {
      rendererSend(NAMES.mainWindow.save_data, {
        path: 'playInfo',
        data: n,
      })
    }, 2000)

    rendererOn(NAMES.mainWindow.get_lyric_info, (event, info) => {
      switch (info.action) {
        case 'info':
          this.handleUpdateWinLyricInfo('info', {
            songmid: this.musicInfo.songmid,
            singer: this.musicInfo.singer,
            name: this.musicInfo.name,
            album: this.musicInfo.album,
            lrc: this.musicInfo.lrc,
            tlrc: this.musicInfo.tlrc,
            lxlrc: this.musicInfo.lxlrc,
            isPlay: this.isPlay,
            line: this.lyric.line,
            played_time: audio.currentTime * 1000,
          }, info)
          break
        case 'status':
          this.handleUpdateWinLyricInfo('status', {
            isPlay: this.isPlay,
            line: this.lyric.line,
            played_time: audio.currentTime * 1000,
          }, info)
          break

        default:
          break
      }
    })
    this.registerMediaSessionHandler()
    navigator.mediaDevices.addEventListener('devicechange', this.handleMediaListChange)
    document.addEventListener('mousemove', this.handleVolumeMsMove)
    document.addEventListener('mouseup', this.handleVolumeMsUp)
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    navigator.mediaDevices.removeEventListener('devicechange', this.handleMediaListChange)
    document.removeEventListener('mousemove', this.handleVolumeMsMove)
    document.removeEventListener('mouseup', this.handleVolumeMsUp)
    window.removeEventListener('resize', this.handleResize)
    this.handleRegisterEvent('off')
  },
  watch: {
    changePlay(n) {
      if (!n) return
      this.resetChangePlay()
      if (window.restorePlayInfo) {
        this.handleRestorePlay(window.restorePlayInfo)
        window.restorePlayInfo = null
        navigator.mediaSession.playbackState = 'paused'
        this.updateMediaSessionInfo()
        return
      }
      // console.log('changePlay')
      this.handleRemoveMusic()
      if (!this.playInfo.musicInfo) return
      this.play()
    },
    'setting.player.togglePlayMethod'(n) {
      audio.loop = n === 'singleLoop'
      if (this.playedList.length) this.clearPlayedList()
      if (n == 'random' && this.playMusicInfo && !this.playMusicInfo.isTempPlay) this.setPlayedList(this.playMusicInfo)
    },
    'setting.player.isMute'(n) {
      audio.muted = n
    },
    'setting.player.mediaDeviceId'(n) {
      this.setMediaDevice()
    },
    'setting.player.isShowLyricTranslation'() {
      this.setLyric()
    },
    'setting.player.isPlayLxlrc'() {
      this.setLyric()
    },
    async list(n, o) {
      if (this.playInfo.isTempPlay) return
      if (n === o && this.musicInfo.songmid) {
        let index = this.listId == 'download'
          ? n.findIndex(s => s.musicInfo.songmid === this.musicInfo.songmid)
          : n.findIndex(s => s.songmid === this.musicInfo.songmid)
        if (index < 0) {
          // console.log(this.playIndex)
          if (n.length) {
            this.setPlayIndex(this.playInfo.listPlayIndex - 1)
            this.playNext()
          } else {
            this.setPlayMusicInfo(null)
          }
        } else {
          this.setPlayIndex(index)
        }
        // console.log(this.playIndex)
      }
    },
    progress(n, o) {
      if (n.toFixed(2) === o.toFixed(2)) return
      this.sendProgressEvent(n, 'normal')
    },
    volume(n) {
      this.handleSaveVolume(n)
    },
    nowPlayTime(n, o) {
      if (Math.abs(n - o) > 2) this.isActiveTransition = true
      if (this.setting.player.isSavePlayTime && !this.playInfo.isTempPlay) {
        this.savePlayInfo({
          time: n,
          maxTime: this.maxPlayTime,
          listId: this.listId,
          list: this.listId == null ? this.list : null,
          index: this.playIndex,
        })
      }
    },
    maxPlayTime(maxPlayTime) {
      if (!this.playInfo.isTempPlay) {
        this.savePlayInfo({
          time: this.nowPlayTime,
          maxTime: maxPlayTime,
          listId: this.listId,
          list: this.listId == null ? this.list : null,
          index: this.playIndex,
        })
      }
    },
  },
  methods: {
    ...mapActions('player', ['getUrl', 'getPic', 'getLrc', 'playPrev', 'playNext']),
    ...mapActions('list', ['getOtherSource']),
    ...mapMutations('player', [
      'setPlayMusicInfo',
      'setPlayIndex',
      'resetChangePlay',
      'clearPlayedList',
      'setPlayedList',
    ]),
    ...mapMutations(['setVolume', 'setPlayNextMode', 'setVisibleDesktopLyric', 'setLockDesktopLyric']),
    ...mapMutations('list', ['updateMusicInfo']),
    ...mapMutations(['setMediaDeviceId']),
    handleRegisterEvent(action) {
      let eventHub = window.eventHub
      let name = action == 'on' ? '$on' : '$off'
      eventHub[name](eventPlayerNames.toggle_play.action, this.togglePlay)
      eventHub[name](eventPlayerNames.next.action, this.playNext)
      eventHub[name](eventPlayerNames.prev.action, this.playPrev)
      eventHub[name](eventPlayerNames.volume_up.action, this.handleSetVolumeUp)
      eventHub[name](eventPlayerNames.volume_down.action, this.handleSetVolumeDown)
      eventHub[name](eventPlayerNames.volume_mute.action, this.handleSetVolumeMute)
    },
    init() {
      audio = new window.Audio()
      this.setMediaDevice()
      this.volume = audio.volume = this.setting.player.volume
      audio.controls = false
      audio.autoplay = true
      audio.preload = 'auto'
      audio.loop = this.setting.player.togglePlayMethod === 'singleLoop'
      audio.muted = this.setting.player.isMute

      audio.addEventListener('playing', () => {
        console.log('开始播放')
        this.clearBufferTimeout()
        this.statusText = this.$t('core.player.playing')
        this.status = ''
        this.startPlay()
      })
      audio.addEventListener('pause', () => {
        console.log('暂停播放')
        window.lrc.pause()
        this.stopPlay()
        // this.status = this.statusText = this.$t('core.player.stop')
      })
      audio.addEventListener('ended', () => {
        console.log('播放完毕')
        this.stopPlay()
        this.status = this.statusText = this.$t('core.player.end')
        this.playNext()
      })
      audio.addEventListener('error', () => {
        // console.log('code', audio.error)
        if (!this.musicInfo.songmid) return
        console.log('出错')
        this.stopPlay()
        this.clearLoadingTimeout()
        if (this.listId != 'download' && audio.error.code !== 1 && this.retryNum < 2) { // 若音频URL无效则尝试刷新2次URL
          // console.log(this.retryNum)
          if (!this.restorePlayTime) this.restorePlayTime = audio.currentTime // 记录出错的播放时间
          this.retryNum++
          this.setUrl(this.currentMusicInfo, true)
          this.status = this.statusText = this.$t('core.player.refresh_url')
          return
        }

        this.sendProgressEvent(this.progress, 'error')
        this.status = this.statusText = this.$t('core.player.error')
        this.addDelayNextTimeout()
      })
      audio.addEventListener('loadeddata', () => {
        console.log('loadeddata')
        this.clearLoadingTimeout()
        this.status = this.statusText = this.$t('core.player.loading')
        this.maxPlayTime = audio.duration
        if (this.restorePlayTime) {
          audio.currentTime = this.restorePlayTime
          this.restorePlayTime = 0
        }
        if (!this.targetSong.interval && this.listId != 'download') {
          this.updateMusicInfo({ listId: this.listId, id: this.targetSong.songmid, musicInfo: this.targetSong, data: { interval: formatPlayTime2(this.maxPlayTime) } })
        }

        this.updatePositionState()
      })
      audio.addEventListener('loadstart', () => {
        console.log('loadstart')
        this.startLoadingTimeout()
        this.status = this.statusText = this.$t('core.player.loading')
      })
      audio.addEventListener('canplay', () => {
        console.log('加载完成开始播放')
        if (this.mediaBuffer.playTime) {
          let playTime = this.mediaBuffer.playTime
          this.mediaBuffer.playTime = 0
          audio.currentTime = playTime
        }
        this.updatePositionState()

        // if (this.musicInfo.lrc) window.lrc.play(audio.currentTime * 1000)
        this.status = this.statusText = ''
      })
      // audio.addEventListener('canplaythrough', () => {
      //   console.log('音乐加载完毕')
      //   // if (this.musicInfo.lyric.orgLrc) this.musicInfo.lyric.lrc.play(audio.currentTime * 1000)
      //   this.status = this.statusText = '播放中...'
      // })
      audio.addEventListener('emptied', () => {
        this.mediaBuffer.playTime = 0
        this.clearLoadingTimeout()
        this.clearBufferTimeout()

        // console.log('媒介资源元素突然为空，网络错误 or 切换歌曲？')
        // this.status = this.statusText = '媒介资源元素突然为空，网络错误？'
      })

      audio.addEventListener('timeupdate', () => {
        this.nowPlayTime = audio.currentTime
      })

      audio.addEventListener('waiting', () => {
        // this.musicInfo.lyric.lrc.pause()
        // console.log('缓冲中...')
        this.stopPlay()
        this.startBuffering()
        this.status = this.statusText = this.$t('core.player.buffering')
      })

      window.lrc = new Lyric({
        lineClassName: 'lrc-content',
        fontClassName: 'font',
        shadowContent: false,
        activeLineClassName: 'active',
        onPlay: (line, text) => {
          this.lyric.text = text
          this.lyric.line = line
          this.statusText = text
          // console.log(line, text)
        },
        onSetLyric: lines => { // listening lyrics seting event
          // console.log(lines) // lines is array of all lyric text
          this.lyric.lines = lines
          this.lyric.line = 0
        },
        // offset: 80,
      })

      this.handleRegisterEvent('on')
    },
    async play() {
      this.clearDelayNextTimeout()

      let targetSong = this.targetSong

      if (this.setting.player.togglePlayMethod == 'random' && !this.playMusicInfo.isTempPlay) this.setPlayedList(this.playMusicInfo)
      this.retryNum = 0
      this.restorePlayTime = 0

      if (this.listId == 'download') {
        const filePath = path.join(this.setting.download.savePath, targetSong.fileName)
        // console.log(filePath)
        if (!await checkPath(filePath) || !targetSong.isComplate || /\.ape$/.test(filePath)) {
          return this.list.length == 1 ? null : this.playNext()
        }
        this.currentMusicInfo = targetSong = window.downloadListFullMap.get(targetSong.key).musicInfo
        this.musicInfo.songmid = targetSong.songmid
        this.musicInfo.singer = targetSong.singer
        this.musicInfo.name = targetSong.name
        this.musicInfo.album = targetSong.albumName
        audio.src = filePath
        // console.log(filePath)
      } else {
        // if (!this.assertApiSupport(targetSong.source)) return this.playNext()
        this.currentMusicInfo = targetSong
        this.musicInfo.songmid = targetSong.songmid
        this.musicInfo.singer = targetSong.singer
        this.musicInfo.name = targetSong.name
        this.musicInfo.album = targetSong.albumName
        this.setUrl(targetSong)
      }

      this.updateMediaSessionInfo()
      this.setImg(targetSong)
      this.setLrc(targetSong)
      this.handleUpdateWinLyricInfo('music_info', {
        songmid: this.musicInfo.songmid,
        singer: this.musicInfo.singer,
        name: this.musicInfo.name,
        album: this.musicInfo.album,
      })
      if (!this.playInfo.isTempPlay) {
        this.savePlayInfo({
          time: this.nowPlayTime,
          maxTime: this.maxPlayTime,
          listId: this.listId,
          list: this.listId == null ? this.list : null,
          index: this.playIndex,
        })
      }
    },
    clearDelayNextTimeout() {
      // console.log(this.delayNextTimeout)
      if (this.delayNextTimeout) {
        clearTimeout(this.delayNextTimeout)
        this.delayNextTimeout = null
      }
    },
    addDelayNextTimeout() {
      this.clearDelayNextTimeout()
      this.delayNextTimeout = setTimeout(() => {
        this.delayNextTimeout = null
        this.playNext()
      }, 5000)
    },

    hanldeListRandom(list, index) {
      return getRandom(0, list.length)
    },
    startPlay() {
      this.isPlay = true
      if (this.musicInfo.lrc) window.lrc.play(audio.currentTime * 1000)
      this.handleUpdateWinLyricInfo('play', audio.currentTime * 1000)
      this.setAppTitle()
      this.sendProgressEvent(this.progress, 'normal')
      navigator.mediaSession.playbackState = 'playing'
    },
    stopPlay() {
      this.isPlay = false
      window.lrc.pause()
      this.handleUpdateWinLyricInfo('pause')
      this.clearAppTitle()
      this.$nextTick(() => {
        if (this.playMusicInfo) {
          this.sendProgressEvent(this.progress, 'paused')
          navigator.mediaSession.playbackState = 'paused'
        } else {
          this.sendProgressEvent(this.progress, 'none')
          navigator.mediaSession.playbackState = 'none'
        }
      })
    },
    handleSetProgress(event) {
      this.setProgress(event.offsetX / this.pregessWidth * this.maxPlayTime)
    },
    setProgress(time) {
      if (!audio.src) return
      if (this.restorePlayTime) this.restorePlayTime = time
      if (this.mediaBuffer.playTime) {
        this.clearBufferTimeout()
        this.mediaBuffer.playTime = time
        this.startBuffering()
      }
      audio.currentTime = time

      if (!this.isPlay) audio.play()
    },
    setProgressWidth() {
      this.pregessWidth = parseInt(
        window.getComputedStyle(this.$refs.dom_progress, null).width,
      )
    },
    async togglePlay() {
      if (!audio.src) {
        if (this.restorePlayTime != null) {
          if (this.listId == 'download') {
            const filePath = path.join(this.setting.download.savePath, this.targetSong.fileName)
            // console.log(filePath)
            if (!await checkPath(filePath) || !this.targetSong.isComplate || /\.ape$/.test(filePath)) {
              if (this.list.length == 1) {
                this.handleRemoveMusic()
              } else {
                this.playNext()
              }
              return
            }
            audio.src = filePath
          } else {
            // if (!this.assertApiSupport(this.targetSong.source)) return this.playNext()
            this.setUrl(this.targetSong)
          }
        }
        return
      }
      if (this.isPlay) {
        audio.pause()
        this.clearBufferTimeout()
      } else {
        audio.play()
      }
    },
    imgError(e) {
      // e.target.src = 'https://y.gtimg.cn/music/photo_new/T002R500x500M000002BMEC42fM8S3.jpg'
      this.musicInfo.img = null
    },
    getPlayType(highQuality, songInfo) {
      let type = '128k'
      let list = window.globalObj.qualityList[songInfo.source]
      if (highQuality && songInfo._types['320k'] && list && list.includes('320k')) type = '320k'
      return type
    },
    setUrl(targetSong, isRefresh, isRetryed = false) {
      let type = this.getPlayType(this.setting.player.highQuality, targetSong)
      // this.musicInfo.url = await getMusicUrl(targetSong, type)
      this.status = this.statusText = this.$t('core.player.geting_url')

      return this.getUrl({
        musicInfo: targetSong,
        type,
        isRefresh,
        onToggleSource: () => {
          this.status = this.statusText = 'Try toggle source...'
        },
      }).then(url => {
        if (targetSong !== this.targetSong || this.isPlay) return
        audio.src = this.musicInfo.url = url
      }).catch(err => {
        // console.log('err', err.message)
        if (targetSong !== this.targetSong || this.isPlay) return
        if (err.message == requestMsg.cancelRequest) return
        if (!isRetryed) return this.setUrl(targetSong, isRefresh, true)
        this.status = this.statusText = err.message
        this.addDelayNextTimeout()
        return Promise.reject(err)
      })
    },
    setImg(targetSong) {
      this.musicInfo.img = targetSong.img

      if (!this.musicInfo.img) {
        this.getPic(targetSong).then(() => {
          if (targetSong.songmid !== this.musicInfo.songmid) return
          this.musicInfo.img = targetSong.img
          this.updateMediaSessionInfo()
        })
      }
    },
    setLrc(targetSong) {
      this.getLrc(targetSong).then(({ lyric, tlyric, lxlyric }) => {
        if (targetSong.songmid !== this.musicInfo.songmid) return
        return (
          global.i18n.locale == 'zh-tw'
            ? Promise.all([
              lyric
                ? rendererInvoke(NAMES.mainWindow.lang_s2t, Buffer.from(lyric).toString('base64')).then(b64 => Buffer.from(b64, 'base64').toString())
                : Promise.resolve(''),
              tlyric
                ? rendererInvoke(NAMES.mainWindow.lang_s2t, Buffer.from(tlyric).toString('base64')).then(b64 => Buffer.from(b64, 'base64').toString())
                : Promise.resolve(''),
              lxlyric
                ? rendererInvoke(NAMES.mainWindow.lang_s2t, Buffer.from(lxlyric).toString('base64')).then(b64 => Buffer.from(b64, 'base64').toString())
                : Promise.resolve(''),
            ])
            : Promise.resolve([lyric, tlyric, lxlyric])
        ).then(([lyric, tlyric, lxlyric]) => {
          this.musicInfo.lrc = lyric
          this.musicInfo.tlrc = tlyric
          this.musicInfo.lxlrc = lxlyric
        })
      }).catch((err) => {
        console.log(err)
        if (targetSong.songmid !== this.musicInfo.songmid) return
        this.status = this.statusText = this.$t('core.player.lyric_error')
      }).finally(() => {
        if (targetSong.songmid !== this.musicInfo.songmid) return
        this.handleUpdateWinLyricInfo('lyric', { lrc: this.musicInfo.lrc, tlrc: this.musicInfo.tlrc, lxlrc: this.musicInfo.lxlrc })
        this.setLyric()
      })
    },
    handleRemoveMusic() {
      this.stopPlay()
      audio.src = null
      audio.removeAttribute('src')
      this.statusText = '^-^'
      this.musicInfo.img = null
      this.status = this.musicInfo.name = this.musicInfo.singer = ''
      this.musicInfo.songmid = null
      this.musicInfo.lrc = null
      this.musicInfo.tlrc = null
      this.musicInfo.lxlrc = null
      this.musicInfo.url = null
      this.nowPlayTime = 0
      this.maxPlayTime = 0
      this.lyric.lines = []
      this.lyric.line = -1
      this.lyric.text = 0
      this.handleUpdateWinLyricInfo('lines', [])
      this.handleUpdateWinLyricInfo('line', 0)
      this.currentMusicInfo = {}
    },
    sendProgressEvent(status, mode) {
      // console.log(status)
      this.setting.player.isShowTaskProgess && rendererSend(NAMES.mainWindow.progress, {
        status: status < 0.01 ? 0.01 : status,
        mode: mode || 'normal',
      })
    },
    setAppTitle() {
      setTitle(`${this.musicInfo.name} - ${this.musicInfo.singer}`)
    },
    clearAppTitle() {
      setTitle()
    },
    handleVolumeMsDown(e) {
      this.volumeEvent.isMsDown = true
      this.volumeEvent.msDownX = e.clientX

      let val = e.offsetX / 80
      if (val < 0) val = 0
      if (val > 1) val = 1

      this.volume = val
      this.volumeEvent.msDownVolume = val
      if (audio) audio.volume = this.volume

      if (this.setting.player.isMute) this.setVolume(false)
    },
    handleSetVolumeMute() {
      audio.muted = !audio.muted
      this.setVolume(audio.muted)
    },
    handleVolumeMsUp(e) {
      this.volumeEvent.isMsDown = false
    },
    handleVolumeMsMove(e) {
      if (!this.volumeEvent.isMsDown) return
      this.handleSetVolume(this.volumeEvent.msDownVolume + (e.clientX - this.volumeEvent.msDownX) / 80)
    },
    handleSetVolumeUp(step = 0.02) {
      this.handleSetVolume(this.volume + step)
    },
    handleSetVolumeDown(step = 0.02) {
      this.handleSetVolume(this.volume - step)
    },
    handleSetVolume(num) {
      this.volume = num < 0 ? 0 : num > 1 ? 1 : num
      if (audio) audio.volume = this.volume
    },
    handleCopy(text) {
      clipboardWriteText(text)
    },
    handleResize() {
      this.setProgressWidth()
    },
    handleToMusicLocation() {
      if (!this.listId || this.listId == '__temp__' || this.listId == 'download' || !this.currentMusicInfo.songmid) return
      if (this.playIndex == -1) return
      this.$router.push({
        path: 'list',
        query: {
          id: this.listId,
          scrollIndex: this.playInfo.playIndex,
        },
      })
    },
    showPlayerDetail() {
      if (!this.currentMusicInfo.songmid) return
      this.isShowPlayerDetail = true
    },
    handleTransitionEnd(e) {
      // console.log(e)
      this.isActiveTransition = false
    },
    startLoadingTimeout() {
      // console.log('start load timeout')
      this.loadingTimeout = setTimeout(() => {
        this.playNext()
      }, 20000)
    },
    clearLoadingTimeout() {
      if (!this.loadingTimeout) return
      // console.log('clear load timeout')
      clearTimeout(this.loadingTimeout)
      this.loadingTimeout = null
    },
    startBuffering() {
      console.log('start t')
      if (this.mediaBuffer.timeout) return
      this.mediaBuffer.timeout = setTimeout(() => {
        this.mediaBuffer.timeout = null
        if (!this.mediaBuffer.playTime) this.mediaBuffer.playTime = audio.currentTime
        let skipTime = audio.currentTime + getRandom(3, 6)
        if (skipTime > this.maxPlayTime) skipTime = (this.maxPlayTime - audio.currentTime) / 2
        if (skipTime - this.mediaBuffer.playTime < 1 || this.maxPlayTime - skipTime < 1) {
          this.mediaBuffer.playTime = 0
          this.playNext()
          return
        }
        this.startBuffering()
        audio.currentTime = skipTime
        console.log(this.mediaBuffer.playTime)
        console.log(audio.currentTime)
      }, 3000)
    },
    clearBufferTimeout() {
      console.log('clear t')
      if (!this.mediaBuffer.timeout) return
      clearTimeout(this.mediaBuffer.timeout)
      this.mediaBuffer.timeout = null
      this.mediaBuffer.playTime = 0
    },
    async setMediaDevice() {
      let mediaDeviceId = this.setting.player.mediaDeviceId
      let label = this.prevDeviceLabel
      const devices = await navigator.mediaDevices.enumerateDevices()
      let device = devices.find(device => device.deviceId === mediaDeviceId)
      if (device) {
        mediaDeviceId = device.deviceId
        label = device.label
      } else {
        mediaDeviceId = 'default'
        device = devices.find(device => device.deviceId === mediaDeviceId)
        if (device) label = device.label
      }

      this.prevDeviceLabel = label
      // console.log(device)
      audio.setSinkId(mediaDeviceId).catch(err => {
        console.log(err)
        this.setMediaDeviceId('default')
      })
    },
    handleDeviceChangeStopPlay(device, mediaDeviceId) {
      // console.log(device)
      // console.log(this.setting.player.isMediaDeviceRemovedStopPlay, this.isPlay, device.label, this.prevDeviceLabel)
      if (
        this.setting.player.isMediaDeviceRemovedStopPlay &&
        this.isPlay &&
        device.label != this.prevDeviceLabel
      ) this.togglePlay()
    },
    async handleMediaListChange() {
      let mediaDeviceId = this.setting.player.mediaDeviceId
      const devices = await navigator.mediaDevices.enumerateDevices()
      let device = devices.find(device => device.deviceId === mediaDeviceId)
      if (!device) device = devices.find(device => device.deviceId === 'default')
      if (!device) device = { label: null, deviceId: null }

      this.handleDeviceChangeStopPlay(device, mediaDeviceId)

      this.setMediaDeviceId(device.deviceId)
    },
    handlePlayDetailAction({ type, data }) {
      switch (type) {
        case 'prev':
          this.playPrev()
          break
        case 'togglePlay':
          this.togglePlay()
          break
        case 'next':
          this.playNext()
          break
        case 'progress':
          this.setProgress(data * this.maxPlayTime)
          break
        case 'volume':
          break
      }
    },
    assertApiSupport(source) {
      return assertApiSupport(source)
    },
    handleUpdateWinLyricInfo(type, data, info) {
      rendererSend(NAMES.mainWindow.set_lyric_info, {
        type,
        data,
        info,
      })
    },
    setLyric() {
      window.lrc.setLyric(
        this.setting.player.isPlayLxlrc && this.musicInfo.lxlrc ? this.musicInfo.lxlrc : this.musicInfo.lrc,
        this.setting.player.isShowLyricTranslation && this.musicInfo.tlrc ? this.musicInfo.tlrc : '',
        // (
        //   this.setting.player.isShowLyricTranslation && this.musicInfo.tlrc
        //     ? (this.musicInfo.tlrc + '\n')
        //     : ''
        // ) + (this.musicInfo.lrc || ''),
      )
      if (this.isPlay && (this.musicInfo.url || this.listId == 'download')) {
        window.lrc.play(audio.currentTime * 1000)
        this.handleUpdateWinLyricInfo('play', audio.currentTime * 1000)
      }
    },
    toggleDesktopLyric() {
      this.setVisibleDesktopLyric(!this.setting.desktopLyric.enable)
    },
    handleToggleLockDesktopLyric() {
      this.setLockDesktopLyric(!this.setting.desktopLyric.isLock)
    },
    toggleNextPlayMode() {
      let index = playNextModes.indexOf(this.setting.player.togglePlayMethod)
      if (++index >= playNextModes.length) index = -1
      this.setPlayNextMode(playNextModes[index] || '')
    },
    addMusicTo() {
      if (!this.musicInfo.songmid) return
      this.isShowAddMusicTo = true
    },
    async handleRestorePlay(restorePlayInfo) {
      let musicInfo

      if (this.listId == 'download') {
        this.currentMusicInfo = musicInfo = window.downloadListFullMap.get(this.list[restorePlayInfo.index].key).musicInfo
        // console.log(filePath)
      } else {
        // if (!this.assertApiSupport(targetSong.source)) return this.playNext()
        musicInfo = this.list[restorePlayInfo.index]
        this.currentMusicInfo = musicInfo
      }

      this.musicInfo.songmid = musicInfo.songmid
      this.musicInfo.singer = musicInfo.singer
      this.musicInfo.name = musicInfo.name
      this.musicInfo.album = musicInfo.albumName
      this.setImg(musicInfo)
      this.setLrc(musicInfo)
      this.nowPlayTime = this.restorePlayTime = restorePlayInfo.time
      this.maxPlayTime = restorePlayInfo.maxTime || 0
      this.handleUpdateWinLyricInfo('music_info', {
        songmid: this.musicInfo.songmid,
        singer: this.musicInfo.singer,
        name: this.musicInfo.name,
        album: this.musicInfo.album,
      })
      this.$nextTick(() => {
        this.sendProgressEvent(this.progress, 'paused')
      })

      if (this.setting.player.togglePlayMethod == 'random') this.setPlayedList(this.playMusicInfo)
    },
    updateMediaSessionInfo() {
      const mediaMetadata = {
        title: this.currentMusicInfo.name,
        artist: this.currentMusicInfo.singer,
        album: this.currentMusicInfo.albumName,
      }
      if (this.currentMusicInfo.img) mediaMetadata.artwork = [{ src: this.currentMusicInfo.img }]
      navigator.mediaSession.metadata = new window.MediaMetadata(mediaMetadata)
    },
    updatePositionState() {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: audio.currentTime,
      })
    },
    registerMediaSessionHandler() {
      // navigator.mediaSession.setActionHandler('play', () => {
      //   if (this.isPlay || !this.playMusicInfo) return
      //   console.log('play')
      //   this.startPlay()
      // })
      // navigator.mediaSession.setActionHandler('pause', () => {
      //   if (!this.isPlay || !this.playMusicInfo) return
      //   console.log('pause')
      //   this.stopPlay()
      // })
      navigator.mediaSession.setActionHandler('stop', () => {
        if (!this.isPlay || !this.playMusicInfo) return
        console.log('stop')
        this.stopPlay()
      })
      navigator.mediaSession.setActionHandler('seekbackward', details => {
        if (!this.isPlay || !this.playMusicInfo) return
        console.log('seekbackward')
        this.setProgress(Math.max(audio.currentTime - details.seekOffset, 0))
      })
      navigator.mediaSession.setActionHandler('seekforward', details => {
        if (!this.isPlay || !this.playMusicInfo) return
        console.log('seekforward')
        this.setProgress(Math.min(audio.currentTime + details.seekOffset, audio.duration))
      })
      navigator.mediaSession.setActionHandler('seekto', details => {
        console.log('seekto', details.seekTime)
        let time = Math.min(details.seekTime, audio.duration)
        time = Math.max(time, 0)
        this.setProgress(time)
      })
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('previoustrack')
        this.playPrev()
      })
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('nexttrack')
        this.playNext()
      })
      // navigator.mediaSession.setActionHandler('skipad', () => {
      //   console.log('')
      // })
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.player {
  height: @height-player;
  background-color: @color-theme_2;
  transition: @transition-theme;
  transition-property: border-color;
  border-top: 2px solid @color-theme;
  box-sizing: border-box;
  display: flex;
  z-index: 2;
  * {
    box-sizing: border-box;
  }
}
.left {
  width: @height-player - 2;
  height: 100%;
  color: @color-theme;
  transition: @transition-theme;
  transition-property: color;
  flex: none;
  padding: 2PX;
  opacity: 1;
  transition: @transition-theme;
  transition-property: opacity;
  display: flex;
  justify-content: center;
  // align-items: center;
  cursor: pointer;

  &:hover {
    opacity: .8;
  }

  svg {
    fill: currentColor;
  }
  img {
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
    max-width: 100%;
    max-height: 100%;
    transition: @transition-theme;
    transition-property: border-color;
    // border-radius: 50%;
    border-radius: @radius-border;
    // border: 2px solid @color-theme_2-background_1;
  }
}
.middle {
  flex: auto;
}
.middle-container {
  height: 100%;
  padding: 5px 10px 5px 8px;
  display: flex;
  flex-flow: column nowrap;
}
.right {
  height: 100%;
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding-left: 15px;
  padding-right: 20px;
}
.column1 {
  flex: auto;
  position: relative;
  font-size: 16px;
  .container {
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
  }
}

.title {
  flex: 0 1 auto;
  min-width: 0;
  padding-right: 5px;
  font-size: 14px;
  line-height: 18px;
  .mixin-ellipsis-1;
}

.controlBtn {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
}


.volume-content {
  flex: none;
  position: relative;
  width: 80px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  opacity: .5;
  transition: opacity @transition-theme;
  &:hover {
    opacity: 1;
  }
}

.volume {
  // cursor: pointer;
  width: 100%;
  height: 0.25em;
  border-radius: 10px;
  // overflow: hidden;
  transition: @transition-theme;
  transition-property: background-color, opacity;
  background-color: @color-player-progress-bar1;
  // background-color: #f5f5f5;
  position: relative;
  border-radius: @radius-progress-border;
}

.muted {
  opacity: .5;
}

.volume-bar {
  position: absolute;
  left: 0;
  top: 0;
  transform: scaleX(0);
  transform-origin: 0;
  transition-property: transform;
  transition-timing-function: ease;
  width: 100%;
  height: 100%;
  border-radius: @radius-progress-border;
  transition-duration: 0.2s;
  background-color: @color-btn;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}


.volume-mask {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.titleBtn {
  flex: none;
  margin-left: 5px;
  height: 100%;
  width: 20px;
  color: @color-btn;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  transition: opacity 0.2s ease;
  opacity: .6;
  cursor: pointer;

  svg {
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  &:hover {
    opacity: 1;
  }
  &:active {
    opacity: 1;
  }
}

.play-btn {
  + .play-btn {
    margin-left: 15px;
  }
  flex: none;
  height: 46%;
  // margin-top: -2px;
  // transition: @transition-theme;
  // transition-property: color;
  // color: @color-theme;
  transition: opacity 0.2s ease;
  opacity: 1;
  cursor: pointer;

  svg {
    fill: currentColor;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  &:hover {
    opacity: 0.8;
  }
  &:active {
    opacity: 0.6;
  }
}

.column2 {
  flex: none;
  padding: 3px 0;
  position: relative;
}

.progress {
  width: 100%;
  height: 4px;
  // overflow: hidden;
  transition: @transition-theme;
  transition-property: background-color;
  background-color: @color-player-progress;
  // background-color: #f5f5f5;
  position: relative;
  border-radius: 20px;
}
.progress-mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.progress-bar {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  transform-origin: 0;
  border-radius: 20px;
}
.progress-bar1 {
  background-color: @color-player-progress-bar1;
}

.progress-bar2 {
  background-color: @color-player-progress-bar2;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
  opacity: 0.8;
}

.bar-transition {
  transition-property: transform;
  transition-timing-function: ease-out;
  transition-duration: 0.2s;
}

.column3 {
  transition: @transition-theme;
  transition-property: color;
  color: @color-theme_2-font;
  flex: none;
  font-size: 12px;
  display: flex;
  padding-top: 2px;
  // justify-content: space-between;
  height: 16px;
  align-items: center;
}

.status-text {
  font-size: 0.98em;
  transition: @transition-theme;
  transition-property: color;
  color: @color-player-status-text;
  .mixin-ellipsis-1;
  // padding: 0 5px;
  padding-right: 5px;
  flex: 1 1 0;
  // text-align: center;
  line-height: 1.2;
  width: 0;
}

#icon-pic {
  color: @color-theme;
  .c1 {
    transition: @transition-theme;
    transition-property: fill;
    fill: @color-player-pic-c1;
  }
  .c2 {
    transition: @transition-theme;
    transition-property: fill;
    fill: @color-player-pic-c2;
  }
}


each(@themes, {
  :global(#container.@{value}) {
    .player {
      background-color: ~'@{color-@{value}-theme_2}';
      border-top-color: ~'@{color-@{value}-theme}';
    }
    .left {
      color: ~'@{color-@{value}-theme}';
      // img {
      //   border-color: ~'@{color-@{value}-theme_2-background_1}';
      // }
    }
    .titleBtn {
      color: ~'@{color-@{value}-btn}';
    }
    .play-btn {
      color: ~'@{color-@{value}-btn}';
      svg {
        filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.3));
      }
    }
    .volume {
      background-color: ~'@{color-@{value}-player-progress-bar1}';
    }

    .volume-bar {
      background-color: ~'@{color-@{value}-btn}';
    }


    .progress {
      background-color: ~'@{color-@{value}-player-progress}';
    }
    .progress-bar1 {
      background-color: ~'@{color-@{value}-player-progress-bar1}';
    }
    .progress-bar2 {
      background-color: ~'@{color-@{value}-player-progress-bar2}';
    }

    .column3 {
      color: ~'@{color-@{value}-theme_2-font}';
    }

    .status-text {
      color: ~'@{color-@{value}-player-status-text}';
    }

    #icon-pic {
      color: ~'@{color-@{value}-theme}';
      .c1 {
        fill: ~'@{color-@{value}-player-pic-c1}';
      }
      .c2 {
        fill: ~'@{color-@{value}-player-pic-c2}';
      }
    }
  }
})

</style>
