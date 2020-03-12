<template lang="pug">
div(:class="$style.player")
  div(:class="$style.left" @click="handleToMusicLocation")
    img(v-if="musicInfo.img" :src="musicInfo.img" @error="imgError")
    svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' height='100%' viewBox='0 0 60 60' space='preserve')
      use(:xlink:href='`#${$style.iconPic}`')
  div(:class="$style.right")
    div(:class="$style.column1")
      div(:class="$style.container")
        div(:class="$style.title" @click="handleCopy(title)" :title="title + $t('core.player.copy_title')") {{title}}
        div(:class="$style.volumeContent")
          div(:class="$style.volume")
            div(:class="$style.volumeBar" :style="{ transform: `scaleX(${volume || 0})` }")
          div(:class="$style.volumeMask" @mousedown="handleVolumeMsDown" ref="dom_volumeMask" :title="`${$t('core.player.volume')}${parseInt(volume * 100)}%`")

        //- div(:class="$style.playBtn" @click='handleNext' title="音量")
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 291.063 291.064' space='preserve')
            use(xlink:href='#icon-sound')
        div(:class="$style.playBtn" @click='handleNext' :title="$t('core.player.next')")
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 220.847 220.847' space='preserve')
            use(xlink:href='#icon-nextMusic')
        div(:class="$style.playBtn" :title="isPlay ? $t('core.player.pause') : $t('core.player.play')" @click='togglePlay')
          svg(v-if="isPlay" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 277.338 277.338' space='preserve')
            use(xlink:href='#icon-pause')
          svg(v-else version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 170 170' space='preserve')
            use(xlink:href='#icon-play')
    div(:class="$style.column2")
      div(:class="$style.progress")
        //- div(:class="[$style.progressBar, $style.progressBar1]" :style="{ transform: `scaleX(${progress || 0})` }")
        div(:class="[$style.progressBar, $style.progressBar2, isActiveTransition ? $style.barTransition : '']" @transitionend="handleTransitionEnd" :style="{ transform: `scaleX(${progress || 0})` }")
      div(:class="$style.progressMask" @click='setProgess' ref="dom_progress")
    div(:class="$style.column3")
      span {{nowPlayTimeStr}}
      span(:class="$style.statusText") {{status}}
      span {{maxPlayTimeStr}}
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
import Lyric from 'lrc-file-parser'
import { rendererSend } from '../../../common/ipc'
import { formatPlayTime2, getRandom, checkPath, setTitle, clipboardWriteText, debounce } from '../../utils'
import { mapGetters, mapActions, mapMutations } from 'vuex'
import { requestMsg } from '../../utils/message'
import { isMac } from '../../../common/utils'

export default {
  data() {
    return {
      show: true,
      audio: null,
      volume: 0,
      nowPlayTime: 0,
      maxPlayTime: 0,
      isPlay: false,
      status: '^-^',
      musicInfo: {
        songmid: null,
        img: null,
        lrc: null,
        url: null,
        name: '^',
        singer: '^',
      },
      targetSong: null,
      pregessWidth: 0,
      lyric: {
        lrc: null,
        text: '',
        line: 0,
      },
      delayNextTimeout: null,
      audioErrorTime: 0,
      retryNum: 0,
      isMac,
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
    }
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('player', ['list', 'playIndex', 'changePlay', 'listId']),
    // pic() {
    //   return this.musicInfo.img ? this.musicInfo.img : ''
    // },
    title() {
      return this.musicInfo.name
        ? `${this.musicInfo.name} - ${this.musicInfo.singer}`
        : ''
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
    isAPITemp() {
      return this.setting.apiSource == 'temp'
    },
  },
  mounted() {
    this.init()
    this.$nextTick(() => {
      this.setProgessWidth()
    })
    this.handleSaveVolume = debounce(volume => {
      this.setVolume(volume)
    }, 300)

    document.addEventListener('mousemove', this.handleVolumeMsMove)
    document.addEventListener('mouseup', this.handleVolumeMsUp)
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    document.removeEventListener('mousemove', this.handleVolumeMsMove)
    document.removeEventListener('mouseup', this.handleVolumeMsUp)
    window.removeEventListener('resize', this.handleResize)
  },
  watch: {
    changePlay(n) {
      if (!n) return
      // console.log('changePlay')
      this.handleRemoveMusic()
      this.resetChangePlay()
      if (this.playIndex < 0) return
      this.stopPlay()
      this.play()
    },
    'setting.player.togglePlayMethod'(n) {
      this.audio.loop = n === 'singleLoop'
    },
    'setting.player.mediaDeviceId'(n) {
      this.setMediaDevice()
    },
    list(n, o) {
      if (n === o) {
        let index = this.listId == 'download'
          ? n.findIndex(s => s.musicInfo.songmid === this.musicInfo.songmid)
          : n.findIndex(s => s.songmid === this.musicInfo.songmid)
        if (index < 0) {
          // console.log(this.playIndex)
          if (n.length) {
            this.fixPlayIndex(this.playIndex - 1)
            this.handleNext()
          } else {
            this.setPlayIndex(-1)
          }
        } else {
          this.fixPlayIndex(index)
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
    },
  },
  methods: {
    ...mapActions('player', ['getUrl', 'getPic', 'getLrc']),
    ...mapMutations('player', [
      'setPlayIndex',
      'fixPlayIndex',
      'resetChangePlay',
    ]),
    ...mapMutations(['setVolume']),
    ...mapMutations('list', ['updateMusicInfo']),
    ...mapMutations(['setMediaDeviceId']),
    init() {
      this.audio = document.createElement('audio')
      this.setMediaDevice()
      this.volume = this.audio.volume = this.setting.player.volume
      this.audio.controls = false
      this.audio.autoplay = true
      this.audio.preload = 'auto'
      this.audio.loop = this.setting.player.togglePlayMethod === 'singleLoop'

      this.audio.addEventListener('playing', () => {
        console.log('开始播放')
        this.status = this.$t('core.player.playing')
        this.startPlay()
      })
      this.audio.addEventListener('pause', () => {
        console.log('暂停播放')
        this.lyric.lrc.pause()
        this.stopPlay()
        this.status = this.$t('core.player.stop')
      })
      this.audio.addEventListener('ended', () => {
        console.log('播放完毕')
        this.stopPlay()
        this.status = this.$t('core.player.end')
        this.handleNext()
      })
      this.audio.addEventListener('error', () => {
        // console.log('code', this.audio.error.code)
        if (!this.musicInfo.songmid) return
        console.log('出错')
        this.stopPlay()
        if (this.listId != 'download' && this.audio.error.code !== 1 && this.retryNum < 2) { // 若音频URL无效则尝试刷新2次URL
          // console.log(this.retryNum)
          if (!this.audioErrorTime) this.audioErrorTime = this.audio.currentTime // 记录出错的播放时间
          this.retryNum++
          this.setUrl(this.list[this.playIndex], true)
          this.status = this.$t('core.player.refresh_url')
          return
        }

        this.sendProgressEvent(this.progress, 'error')
        this.status = this.$t('core.player.error')
        this.addDelayNextTimeout()
      })
      this.audio.addEventListener('loadeddata', () => {
        this.maxPlayTime = this.audio.duration
        if (this.audioErrorTime) {
          this.audio.currentTime = this.audioErrorTime
          this.audioErrorTime = 0
        }
        if (!this.targetSong.interval && this.listId != 'download') this.updateMusicInfo({ id: 'default', index: this.playIndex, data: { interval: formatPlayTime2(this.maxPlayTime) } })
        this.status = this.$t('core.player.loading')
      })
      this.audio.addEventListener('loadstart', () => {
        this.status = this.$t('core.player.loading')
      })
      this.audio.addEventListener('canplay', () => {
        console.log('加载完成开始播放')
        if (this.mediaBuffer.playTime) {
          let playTime = this.mediaBuffer.playTime
          this.mediaBuffer.playTime = 0
          this.audio.currentTime = playTime
        }
        if (this.mediaBuffer.timeout) {
          this.clearBufferTimeout()
        }
        // if (this.musicInfo.lrc) this.lyric.lrc.play(this.audio.currentTime * 1000)
        this.status = this.$t('core.player.loading')
      })
      // this.audio.addEventListener('canplaythrough', () => {
      //   console.log('音乐加载完毕')
      //   // if (this.musicInfo.lyric.orgLrc) this.musicInfo.lyric.lrc.play(this.audio.currentTime * 1000)
      //   this.status = '播放中...'
      // })
      this.audio.addEventListener('emptied', () => {
        this.mediaBuffer.playTime = 0
        this.clearBufferTimeout()

        // console.log('媒介资源元素突然为空，网络错误 or 切换歌曲？')
        // this.status = '媒介资源元素突然为空，网络错误？'
      })

      this.audio.addEventListener('timeupdate', () => {
        this.nowPlayTime = this.audio.currentTime
      })

      this.audio.addEventListener('waiting', () => {
        // this.musicInfo.lyric.lrc.pause()
        // console.log('缓冲中...')
        this.stopPlay()
        this.startBuffering()
        this.status = this.$t('core.player.buffering')
      })

      this.lyric.lrc = new Lyric({
        onPlay: (line, text) => {
          this.lyric.text = text
          this.lyric.line = line
          this.status = text
          // console.log(line, text)
        },
        offset: 150,
      })
    },
    play() {
      console.log('play', this.playIndex)
      this.checkDelayNextTimeout()
      let targetSong = this.targetSong = this.list[this.playIndex]
      this.retryNum = 0
      this.audioErrorTime = 0

      if (this.listId == 'download') {
        console.log(targetSong.filePath)
        if (!checkPath(targetSong.filePath) || !targetSong.isComplate || /\.ape$/.test(targetSong.filePath)) {
          return this.list.length == 1 ? null : this.handleNext()
        }
        this.musicInfo.songmid = targetSong.musicInfo.songmid
        this.musicInfo.singer = targetSong.musicInfo.singer
        this.musicInfo.name = targetSong.musicInfo.name
        this.audio.src = targetSong.filePath
        // console.log(targetSong.filePath)
        this.setImg(targetSong.musicInfo)
        this.setLrc(targetSong.musicInfo)
      } else {
        this.musicInfo.songmid = targetSong.songmid
        this.musicInfo.singer = targetSong.singer
        this.musicInfo.name = targetSong.name
        this.setUrl(targetSong)
        this.setImg(targetSong)
        this.setLrc(targetSong)
      }
    },
    checkDelayNextTimeout() {
      // console.log(this.delayNextTimeout)
      if (this.delayNextTimeout) {
        clearTimeout(this.delayNextTimeout)
        this.delayNextTimeout = null
      }
    },
    addDelayNextTimeout() {
      this.checkDelayNextTimeout()
      this.delayNextTimeout = setTimeout(() => {
        this.delayNextTimeout = null
        this.handleNext()
      }, 5000)
    },
    handleNext() {
      // if (this.list.listName === null) return
      let list
      if (this.listId == 'download') {
        list = this.list.filter(s => !(!checkPath(s.filePath) || !s.isComplate || /\.ape$/.test(s.filePath)))
      } else if (this.isAPITemp) {
        list = this.list.filter(s => s.source == 'kw')
      } else {
        list = [...this.list]
      }
      if (!list.length) return this.setPlayIndex(-1)
      let playIndex = this.list === list ? this.playIndex : list.indexOf(this.list[this.playIndex])
      // console.log(playIndex)
      let index
      switch (this.setting.player.togglePlayMethod) {
        case 'listLoop':
          index = this.hanldeListLoop(list, playIndex)
          break
        case 'random':
          index = this.hanldeListRandom(list, playIndex)
          break
        case 'list':
          index = this.hanldeListNext(list, playIndex)
          break
        default:
          return
      }
      if (index < 0) return
      if (this.list !== list) index = this.list.indexOf(list[index])
      this.setPlayIndex(index)
    },
    hanldeListLoop(list, index) {
      return index === list.length - 1 ? 0 : index + 1
    },
    hanldeListNext(list, index) {
      return index === list.length - 1 ? -1 : index + 1
    },
    hanldeListRandom(list, index) {
      return getRandom(0, list.length)
    },
    startPlay() {
      this.isPlay = true
      if (this.musicInfo.lrc) this.lyric.lrc.play(this.audio.currentTime * 1000)
      this.setAppTitle()
      this.sendProgressEvent(this.progress, 'normal')
    },
    stopPlay() {
      this.isPlay = false
      this.lyric.lrc.pause()
      this.sendProgressEvent(this.progress, 'paused')
      this.clearAppTitle()
    },
    setProgess(e) {
      if (!this.audio.src) return
      // this.isActiveTransition = true
      this.$nextTick(() => {
        const time = (e.offsetX / this.pregessWidth) * this.maxPlayTime
        if (this.audioErrorTime) this.audioErrorTime = time
        if (this.mediaBuffer.playTime) {
          this.clearBufferTimeout()
          this.mediaBuffer.playTime = time
          this.startBuffering()
        }
        this.audio.currentTime = time

        if (!this.isPlay) this.audio.play()
      })
    },
    setProgessWidth() {
      this.pregessWidth = parseInt(
        window.getComputedStyle(this.$refs.dom_progress, null).width,
      )
    },
    togglePlay() {
      if (!this.audio.src) return
      if (this.isPlay) {
        this.audio.pause()
        this.clearBufferTimeout()
      } else {
        this.audio.play()
      }
    },
    imgError(e) {
      // e.target.src = 'https://y.gtimg.cn/music/photo_new/T002R500x500M000002BMEC42fM8S3.jpg'
      this.musicInfo.img = null
    },
    getPlayType(highQuality, songInfo) {
      switch (songInfo.source) {
        case 'wy':
        case 'tx':
        // case 'kg':
          return '128k'
      }
      let type = '128k'
      if (highQuality && songInfo._types['320k']) type = '320k'
      return type
    },
    setUrl(targetSong, isRefresh) {
      let type = this.getPlayType(this.setting.player.highQuality, targetSong)
      this.musicInfo.url = targetSong.typeUrl[type]
      this.status = this.$t('core.player.geting_url')

      return this.getUrl({ musicInfo: targetSong, type, isRefresh }).then(() => {
        this.audio.src = this.musicInfo.url = targetSong.typeUrl[type]
      }).catch(err => {
        if (err.message == requestMsg.cancelRequest) return
        this.status = err.message
        this.addDelayNextTimeout()
        return Promise.reject(err)
      })
    },
    setImg(targetSong) {
      this.musicInfo.img = targetSong.img

      if (!this.musicInfo.img) {
        this.getPic(targetSong).then(() => {
          this.musicInfo.img = targetSong.img
        })
      }
    },
    setLrc(targetSong) {
      this.musicInfo.lrc = targetSong.lrc

      let lrcP = this.musicInfo.lrc
        ? Promise.resolve()
        : this.getLrc(targetSong).then(() => {
          this.musicInfo.lrc = targetSong.lrc
        })

      lrcP
        .then(() => {
          this.lyric.lrc.setLyric(this.musicInfo.lrc)
          if (this.isPlay && (this.musicInfo.url || this.listId == 'download')) this.lyric.lrc.play(this.audio.currentTime * 1000)
        })
        .catch(() => {
          this.status = this.$t('core.player.lyric_error')
        })
    },
    handleRemoveMusic() {
      this.stopPlay()
      this.audio.src = null
      this.audio.removeAttribute('src')
      this.status = '^-^'
      this.musicInfo.img = null
      this.musicInfo.name = this.musicInfo.singer = '^'
      this.musicInfo.songmid = null
      this.musicInfo.lrc = null
      this.musicInfo.url = null
      this.nowPlayTime = 0
      this.maxPlayTime = 0
    },
    sendProgressEvent(status, mode) {
      // console.log(status)
      this.setting.player.isShowTaskProgess && rendererSend('progress', {
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
      this.volumeEvent.isMsMoved = false
      this.volumeEvent.msDownX = e.clientX

      let val = e.offsetX / 70
      if (val < 0) val = 0
      if (val > 1) val = 1

      this.volume = val
      this.volumeEvent.msDownVolume = val
      // console.log(val)
      if (this.audio) this.audio.volume = this.volume
    },
    handleVolumeMsUp(e) {
      this.volumeEvent.isMsDown = false
    },
    handleVolumeMsMove(e) {
      if (!this.volumeEvent.isMsDown) return
      let val = this.volumeEvent.msDownVolume + (e.clientX - this.volumeEvent.msDownX) / 70
      this.volume = val < 0 ? 0 : val > 1 ? 1 : val
      if (this.audio) this.audio.volume = this.volume
      // console.log(val)
    },
    handleCopy(text) {
      clipboardWriteText(text)
    },
    handleResize() {
      this.setProgessWidth()
    },
    handleToMusicLocation() {
      if (this.listId == 'download') return
      if (this.playIndex == -1) return
      this.$router.push({
        path: 'list',
        query: {
          id: this.listId,
          scrollIndex: this.playIndex,
        },
      })
    },
    handleTransitionEnd(e) {
      // console.log(e)
      this.isActiveTransition = false
    },
    startBuffering() {
      console.log('start t')
      if (this.mediaBuffer.timeout) return
      this.mediaBuffer.timeout = setTimeout(() => {
        this.mediaBuffer.timeout = null
        if (!this.mediaBuffer.playTime) this.mediaBuffer.playTime = this.audio.currentTime
        let skipTime = this.audio.currentTime + getRandom(3, 6)
        if (skipTime > this.maxPlayTime) skipTime = (this.maxPlayTime - this.audio.currentTime) / 2
        if (skipTime - this.mediaBuffer.playTime < 1 || this.maxPlayTime - skipTime < 1) {
          this.mediaBuffer.playTime = 0
          this.handleNext()
          return
        }
        this.startBuffering()
        this.audio.currentTime = skipTime
        console.log(this.mediaBuffer.playTime)
        console.log(this.audio.currentTime)
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
      if (!mediaDeviceId) return
      const devices = await navigator.mediaDevices.enumerateDevices()
      let device = devices.find(device => device.deviceId === mediaDeviceId)
      if (!device) return this.setMediaDeviceId('default')
      // console.log(device)
      this.audio.setSinkId(device.deviceId).catch((err) => {
        console.log(err)
        this.setMediaDeviceId('default')
      })
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.player {
  height: @height-player;
  // background-color: rgb(245, 245, 245);
  transition: @transition-theme;
  transition-property: border-color;
  border-top: 2px solid @color-theme;
  box-sizing: border-box;
  display: flex;
  z-index: 1;
  * {
    box-sizing: border-box;
  }
}
.left {
  width: @height-player - 2;
  color: @color-theme;
  transition: @transition-theme;
  transition-property: color;
  flex: none;
  padding: 2px;
  opacity: 1;
  transition: @transition-theme;
  transition-property: opacity;
  cursor: pointer;

  &:hover {
    opacity: .8;
  }

  svg {
    fill: currentColor;
  }
  img {
    max-width: 100%;
    max-height: 100%;
    transition: @transition-theme;
    transition-property: border-color;
    // border: 2px solid @color-theme_2-background_1;
  }
}
.right {
  flex: auto;
  // margin-left: 10px;
  padding: 5px 10px 5px 8px;
  display: flex;
  flex-flow: column nowrap;
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
  flex: 1 1 0;
  width: 0;
  padding-right: 5px;
  font-size: 14px;
  line-height: 18px;
  .mixin-ellipsis-1;
}

.volume-content {
  position: relative;
  width: 100px;
  display: flex;
  align-items: center;
  padding: 0 15px;
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
  transition-property: background-color;
  background-color: @color-player-progress;
  // background-color: #f5f5f5;
  position: relative;
  border-radius: @radius-progress-border;
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
  background-color: @color-theme;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

.volume-mask {
  position: absolute;
  left: 15px;
  right: 15px;
  top: 0;
  width: 70%;
  height: 100%;
  cursor: pointer;
}

.play-btn {
  + .play-btn {
    margin-left: 10px;
  }
  flex: none;
  height: 95%;
  width: 20px;
  align-self: center;
  // margin-top: -2px;
  transition: @transition-theme;
  transition-property: color;
  color: @color-theme;
  transition: opacity 0.1s ease;
  opacity: 1;
  cursor: pointer;

  svg {
    fill: currentColor;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  &:active {
    opacity: 0.7;
  }
}

.column2 {
  flex: none;
  padding: 3px 0;
  position: relative;
}

.progress {
  width: 100%;
  height: 0.15rem;
  border-radius: 0.2rem;
  // overflow: hidden;
  transition: @transition-theme;
  transition-property: background-color;
  background-color: @color-player-progress;
  // background-color: #f5f5f5;
  position: relative;
  border-radius: @radius-progress-border;
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
  border-radius: @radius-progress-border;
}
.progress-bar1 {
  background-color: @color-player-progress-bar1;
}

.progress-bar2 {
  background-color: @color-player-progress-bar2;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
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
  align-items: center;
}

.status-text {
  font-size: 0.98em;
  transition: @transition-theme;
  transition-property: color;
  color: @color-player-status-text;
  .mixin-ellipsis-1;
  padding: 0 5px;
  flex: 1 1 0;
  text-align: center;
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
      border-top-color: ~'@{color-@{value}-theme}';
    }
    .left {
      color: ~'@{color-@{value}-theme}';
      // img {
      //   border-color: ~'@{color-@{value}-theme_2-background_1}';
      // }
    }
    .play-btn {
      color: ~'@{color-@{value}-theme}';
      svg {
        filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.3));
      }
    }
    .volume {
      background-color: ~'@{color-@{value}-player-progress}';
    }

    .volume-bar {
      background-color: ~'@{color-@{value}-theme}';
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
    }


    .progress {
      background-color: ~'@{color-@{value}-player-progress}';
    }
    .progress-bar1 {
      background-color: ~'@{color-@{value}-player-progress-bar1}';
    }
    .progress-bar2 {
      background-color: ~'@{color-@{value}-player-progress-bar2}';
      box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
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
