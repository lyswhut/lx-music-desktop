<template>
  <div :class="[$style.volumeContent, className]">
    <div :class="[$style.volume ]">
      <div ref="dom_volumeBar" :class="$style.volumeBar" :style="{ transform: `scaleX(${volume || 0})` }" />
    </div>
    <div :class="$style.volumeMask" @mousedown="handleVolumeMsDown" />
  </div>
</template>

<script>
import { ref, onBeforeUnmount } from '@common/utils/vueTools'
// import { player as eventPlayerNames } from '@renderer/event/names'

import { volume, isMute } from '@renderer/store/player/volume'
import { appSetting } from '@renderer/store/setting'

export default {
  props: {
    className: {
      type: String,
      default: '',
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

      window.app_event.setVolume(volumeEvent.msDownVolume = val)

      // if (isMute.value) window.app_event.setVolumeIsMute(false)
    }
    const handleVolumeMsUp = () => {
      volumeEvent.isMsDown = false
    }
    const handleVolumeMsMove = event => {
      if (!volumeEvent.isMsDown) return
      let volume = volumeEvent.msDownVolume + (event.clientX - volumeEvent.msDownX) / dom_volumeBar.value.clientWidth
      if (volume > 1) volume = 1
      else if (volume < 0) volume = 0
      window.app_event.setVolume(volume)
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
      appSetting,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.volume-content {
  flex: none;
  position: relative;
  width: 100px;
  padding: 5px 0;
  // margin-right: 10px;
  display: flex;
  align-items: center;
  opacity: .5;
  transition: opacity @transition-normal;
  &:hover {
    opacity: 1;
  }
}

.volume {
  // cursor: pointer;
  width: 100%;
  height: 5px;
  border-radius: 20px;
  overflow: hidden;
  transition: @transition-normal;
  transition-property: background-color, opacity;
  background-color: var(--color-primary-alpha-700);
  // background-color: #f5f5f5;
  position: relative;
  // border-radius: @radius-progress-border;
}

// .muted {
//   opacity: .5;
// }

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
  // border-radius: @radius-progress-border;
  transition-duration: 0.2s;
  background-color: var(--color-button-font);
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

.volume-mask {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

</style>
