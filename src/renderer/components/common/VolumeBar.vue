<template>
<div :class="[$style.volumeContent, className]">
  <div :class="[$style.volume, {[$style.muted]: setting.player.isMute} ]">
    <div :class="$style.volumeBar" ref="dom_volumeBar" :style="{ transform: `scaleX(${volume || 0})` }"></div>
  </div>
  <div :class="$style.volumeMask" @mousedown="handleVolumeMsDown" :tips="`${$t('player__volume')}${parseInt(volume * 100)}%`"></div>
</div>
</template>

<script>
import { ref, onBeforeUnmount } from '@renderer/utils/vueTools'
// import { player as eventPlayerNames } from '@renderer/event/names'
import { volume, isMute, setVolume, setMute } from '@renderer/core/share/volume'

export default {
  props: {
    className: {
      type: String,
    },
    setting: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const volumeEvent = {
      isMsDown: false,
      msDownX: 0,
      msDownVolume: 0,
    }
    const dom_volumeBar = ref(null)

    const handleVolumeMsDown = event => {
      volumeEvent.isMsDown = true
      volumeEvent.msDownX = event.clientX

      let val = event.offsetX / dom_volumeBar.value.clientWidth
      if (val < 0) val = 0
      if (val > 1) val = 1

      setVolume(volumeEvent.msDownVolume = val)

      if (isMute.value) setMute(false)
    }
    const handleVolumeMsUp = () => {
      volumeEvent.isMsDown = false
    }
    const handleVolumeMsMove = event => {
      if (!volumeEvent.isMsDown) return
      let volume = volumeEvent.msDownVolume + (event.clientX - volumeEvent.msDownX) / dom_volumeBar.value.clientWidth
      if (volume > 1) volume = 1
      else if (volume < 0) volume = 0
      setVolume(volume)
    }

    document.addEventListener('mousemove', handleVolumeMsMove)
    document.addEventListener('mouseup', handleVolumeMsUp)
    onBeforeUnmount(() => {
      document.removeEventListener('mousemove', handleVolumeMsMove)
      document.removeEventListener('mouseup', handleVolumeMsUp)
    })

    return {
      handleVolumeMsDown,
      dom_volumeBar,
      volume,
      isMute,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

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


each(@themes, {
  :global(#root.@{value}) {
    .volume {
      background-color: ~'@{color-@{value}-player-progress-bar1}';
    }

    .volume-bar {
      background-color: ~'@{color-@{value}-btn}';
    }
  }
})
</style>
