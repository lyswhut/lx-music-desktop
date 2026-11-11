<template>
  <div :class="$style.cover" @click.stop="emit('play')">
    <img v-if="picUrl" :src="picUrl" alt="" loading="lazy" decoding="async" @error="picUrl = ''">
    <svg v-else :class="$style.coverIcon" viewBox="0 0 24 24" aria-hidden="true">
      <use xlink:href="#icon-music" />
    </svg>
    <div :class="$style.playMask" aria-hidden="true">
      <svg viewBox="0 0 1024 1024" space="preserve">
        <use xlink:href="#icon-play" />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from '@common/utils/vueTools'
import { getPicPath } from '@renderer/core/music'

const picCache = new Map()

const getPic = (musicInfo) => {
  let promise = picCache.get(musicInfo.id)
  if (!promise) {
    promise = getPicPath({ musicInfo, isRefresh: false }).then(url => url ?? '').catch(() => '')
    picCache.set(musicInfo.id, promise)
  }
  return promise
}

const props = defineProps({
  musicInfo: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['play'])

const picUrl = ref(props.musicInfo.meta?.picUrl || '')

let isAlive = true
onBeforeUnmount(() => {
  isAlive = false
})
onMounted(() => {
  if (picUrl.value) return
  void getPic(props.musicInfo).then(url => {
    if (isAlive && !picUrl.value) picUrl.value = url
  })
})
</script>


<style lang="less" module>
.cover {
  position: relative;
  flex: none;
  align-self: center;
  height: 80%;
  aspect-ratio: 1 / 1;
  margin-right: 14px;
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--color-primary-alpha-900);
  color: var(--color-primary-alpha-500);
  cursor: pointer;

  img {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.coverIcon {
  position: absolute;
  inset: 15%;
  width: 70%;
  height: 70%;
  fill: currentColor;
}

.playMask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  opacity: 0;
  color: #fff;
  background-color: rgba(0, 0, 0, .38);
  transition: opacity .15s ease-out;

  svg {
    width: 38%;
    height: 38%;
    margin-left: 5%;
    shape-rendering: geometricPrecision;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, .65));
  }
}

:global(.list-item:hover) .playMask {
  opacity: 1;
}
</style>
