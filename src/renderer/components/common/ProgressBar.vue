<template>
<div :class="[$style.progress, className]">
  <div :class="[$style.progressBar, $style.progressBar2, {[$style.barTransition]: isActiveTransition}]" @transitionend="handleTransitionEnd" :style="{ transform: `scaleX(${progress || 0})` }"></div>
  <div v-show="dragging" :class="[$style.progressBar, $style.progressBar3]" :style="{ transform: `scaleX(${dragProgress || 0})` }"></div>
</div>
<div :class="$style.progressMask" @mousedown="handleMsDown" ref="dom_progress"></div>
</template>

<script>
import { ref, onBeforeUnmount } from '@renderer/utils/vueTools'
import { player as eventPlayerNames } from '@renderer/event/names'
import { playProgress } from '@renderer/core/share/playProgress'

export default {
  props: {
    className: String,
    progress: {
      type: Number,
      required: true,
    },
    isActiveTransition: {
      type: Boolean,
      required: true,
    },
    handleTransitionEnd: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    const msEvent = {
      isMsDown: false,
      msDownX: 0,
      msDownProgress: 0,
    }
    const dom_progress = ref(null)
    const dragging = ref(false)
    const dragProgress = ref(0)

    const handleMsDown = event => {
      msEvent.isMsDown = true
      msEvent.msDownX = event.clientX

      let val = event.offsetX / dom_progress.value.clientWidth
      if (val < 0) val = 0
      if (val > 1) val = 1

      dragProgress.value = msEvent.msDownProgress = val
    }
    const handleMsUp = () => {
      if (msEvent.isMsDown) setProgress(dragProgress.value * playProgress.maxPlayTime)
      msEvent.isMsDown = false
      dragging.value = false
    }
    const handleMsMove = event => {
      if (!msEvent.isMsDown) return
      if (!dragging.value) dragging.value = true

      let progress = msEvent.msDownProgress + (event.clientX - msEvent.msDownX) / dom_progress.value.clientWidth
      if (progress > 1) progress = 1
      else if (progress < 0) progress = 0
      dragProgress.value = progress
    }

    document.addEventListener('mousemove', handleMsMove)
    document.addEventListener('mouseup', handleMsUp)
    onBeforeUnmount(() => {
      document.removeEventListener('mousemove', handleMsMove)
      document.removeEventListener('mouseup', handleMsUp)
    })

    const setProgress = num => {
      window.eventHub.emit(eventPlayerNames.setProgress, num)
    }

    // const handleSetProgress = event => {
    //   // setProgress(event.offsetX / dom_progress.value.clientWidth * playProgress.maxPlayTime)
    // }

    return {
      dom_progress,
      // handleSetProgress,
      dragging,
      dragProgress,
      handleMsDown,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

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

.progress-bar3 {
  background-color: @color-player-progress-bar2;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
  opacity: 0.3;
}

.bar-transition {
  transition-property: transform;
  transition-timing-function: ease-out;
  transition-duration: 0.2s;
}

each(@themes, {
  :global(#root.@{value}) {
    .progress {
      background-color: ~'@{color-@{value}-player-progress}';
    }
    .progress-bar1 {
      background-color: ~'@{color-@{value}-player-progress-bar1}';
    }
    .progress-bar2 {
      background-color: ~'@{color-@{value}-player-progress-bar2}';
    }
    .progress-bar3 {
      background-color: ~'@{color-@{value}-player-progress-bar2}';
    }
  }
})
</style>
