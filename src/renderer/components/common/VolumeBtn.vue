<template>
  <button ref="dom_btn" :class="$style.btn" :aria-label="isMute ? $t('player__volume_muted') : `${$t('player__volume')}${parseInt(volume * 100)}%`" @wheel="handleWheel" @click="handleToggleMute">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
      <use :xlink:href="icon" />
    </svg>
  </button>
  <Teleport to="#root">
    <div v-if="showVolumeBubble" ref="dom_bubble" :class="$style.bubble" :style="bubbleStyle">
      {{ isMute ? $t('player__volume_muted') : `${$t('player__volume')}${Math.trunc(volume * 100)}%` }}
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, reactive, watch, nextTick } from '@common/utils/vueTools'
// import useNextTogglePlay from '@renderer/utils/compositions/useNextTogglePlay'
// import useToggleDesktopLyric from '@renderer/utils/compositions/useToggleDesktopLyric'
// import { musicInfo, playMusicInfo } from '@renderer/store/player/state'
import { saveVolumeIsMute } from '@renderer/store/setting'
import { volume, isMute, showVolumeBubble, flashVolumeBubble } from '@renderer/store/player/volume'

const dom_btn = ref(null)
const dom_bubble = ref(null)
const bubbleStyle = reactive({ top: '0px', left: '0px' })

watch(showVolumeBubble, async(visible) => {
  if (!visible || !dom_btn.value) return
  await nextTick()
  const rect = dom_btn.value.getBoundingClientRect()
  if (!rect.width) return
  const bubbleWidth = dom_bubble.value?.offsetWidth ?? 0
  const bubbleHeight = dom_bubble.value?.offsetHeight ?? 0
  let left = rect.left + rect.width / 2 - window.lx.rootOffset - bubbleWidth / 2
  const maxLeft = document.body.clientWidth - bubbleWidth - 10
  if (left < 10) left = 10
  else if (left > maxLeft) left = maxLeft
  bubbleStyle.left = left + 'px'
  bubbleStyle.top = rect.top - window.lx.rootOffset - bubbleHeight - 6 + 'px'
})

const handleWheel = (event) => {
  window.app_event.setVolume(Math.round(volume.value * 100 + (-event.deltaY / 100 * 2)) / 100)
  flashVolumeBubble()
}

const handleToggleMute = () => {
  saveVolumeIsMute(!isMute.value)
}

const icon = computed(() => {
  return isMute.value
    ? '#icon-volume-mute-outline'
    : volume.value == 0
      ? '#icon-volume-off-outline'
      : volume.value < 0.3
        ? '#icon-volume-low-outline'
        : volume.value < 0.7
          ? '#icon-volume-medium-outline'
          : '#icon-volume-high-outline'
})

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.bubble {
  position: absolute;
  white-space: nowrap;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.2;
  color: var(--color-font);
  background-color: var(--color-content-background);
  border: 1px solid var(--color-primary-light-400-alpha-300);
  box-shadow: 0 2px 8px rgba(0, 0, 0, .15);
  pointer-events: none;
  z-index: 100;
}

.btn {
  position: relative;
  flex: none;
  height: 100%;
  // color: var(--color-button-font);
  justify-content: center;
  align-items: center;
  transition: color @transition-normal;
  cursor: pointer;
  background-color: transparent;
  border: none;
  width: 24px;
  display: flex;
  flex-flow: column nowrap;
  padding: 0;

  svg {
    transition: opacity @transition-fast;
    opacity: .6;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }
  &:hover {
    svg {
      opacity: .9;
    }
  }
  &:active {
    svg {
      opacity: 1;
    }
  }
}

</style>
