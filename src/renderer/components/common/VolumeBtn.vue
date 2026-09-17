<template>
  <div :class="$style.volumeGroup">
    <button ignore-tip :class="[$style.btn, 'chrome-ib']" :aria-label="isMute ? $t('player__volume_muted') : `${$t('player__volume')}${parseInt(volume * 100)}%`" @click="toggleMute" @wheel="handleWheel">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <use :xlink:href="icon" />
      </svg>
    </button>
    <input
      :class="[$style.volume, 'chrome-volume']"
      type="range"
      min="0"
      max="1"
      step="0.01"
      :value="isMute ? 0 : volume"
      :aria-label="$t('player__volume')"
      @input="handleInput"
    >
  </div>
</template>

<script setup>
import { computed } from '@common/utils/vueTools'
import { saveVolumeIsMute } from '@renderer/store/setting'
import { volume, isMute } from '@renderer/store/player/volume'

const handleWheel = (event) => {
  window.app_event.setVolume(Math.round(volume.value * 100 + (-event.deltaY / 100 * 2)) / 100)
}

const handleInput = (event) => {
  const val = Number(event.target.value)
  if (isMute.value) saveVolumeIsMute(false)
  window.app_event.setVolume(val)
}

const toggleMute = () => {
  saveVolumeIsMute(!isMute.value)
}

const icon = computed(() => {
  return isMute.value || volume.value == 0
    ? '#icon-line-mute'
    : '#icon-line-volume'
})

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.volumeGroup {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-right: 10px;
}

.btn {
  flex: none;
}

.volume {
  opacity: 1;
}

@media (max-width: 1200px) {
  .volume {
    display: none;
  }
  .volumeGroup {
    margin-right: 0;
  }
}
</style>
