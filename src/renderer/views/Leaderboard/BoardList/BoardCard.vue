<template>
  <div
    ref="cardRef"
    :class="[$style.card, { [$style.active]: active }]"
    :aria-label="item.name"
    :aria-selected="active"
    @click="handleClick"
  >
    <div :class="$style.cover">
      <img
        v-if="cover && !coverFailed"
        :src="cover"
        alt=""
        loading="lazy"
        decoding="async"
        @error="coverFailed = true"
      />
      <svg v-else :class="$style.coverIcon" viewBox="0 0 24 24" aria-hidden="true">
        <use xlink:href="#icon-music" />
      </svg>
      <div :class="$style.hoverMask">
        <button type="button" :class="$style.playBtn" :aria-label="item.name" @click.stop="handlePlay">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
        </button>
      </div>
    </div>
    <div :class="$style.info">
      <h3 :class="$style.title">{{ item.name }}</h3>
      <ul :class="$style.songs">
        <li v-for="index in 5" :key="index" :class="$style.song">
          <template v-if="songs[index - 1]">
            <span :class="$style.rank">{{ index }}</span>
            <span :class="$style.songText">{{ formatSong(songs[index - 1]) }}</span>
          </template>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from '@common/utils/vueTools'
import { previews, loadBoardPreview } from '@renderer/store/leaderboard/preview'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  active: Boolean,
})

const emit = defineEmits(['select', 'play'])

const cardRef = ref(null)
const coverFailed = ref(false)
let observer = null

// 预览数据统一存放在 store 中（启动时从磁盘缓存恢复 + 预加载），数据到达后自动渲染
const preview = computed(() => previews[props.item.id])
const cover = computed(() => preview.value?.cover ?? '')
const songs = computed(() => preview.value?.songs ?? [])

const load = () => {
  loadBoardPreview(props.item.id)
}

const formatSong = song => {
  return song.singer ? `${song.name} - ${song.singer}` : song.name
}

const handleClick = () => {
  emit('select', props.item.id)
}

const handlePlay = () => {
  emit('play', props.item.id)
}

onMounted(() => {
  load()
  if (preview.value || typeof IntersectionObserver === 'undefined') return
  observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return
    observer.disconnect()
    observer = null
    load()
  }, {
    rootMargin: '200px 0px',
  })
  observer.observe(cardRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.card {
  position: relative;
  display: flex;
  min-width: 0;
  background-color: var(--color-content-background);
  border: 1px solid var(--color-primary-light-400-alpha-300);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color @transition-fast, box-shadow @transition-fast, transform @transition-fast;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 7px;
    pointer-events: none;
    opacity: 0;
    transition: opacity @transition-fast;
    box-shadow:
      inset 1px 1px 0 rgba(255, 255, 255, .85),
      inset -1px -1px 0 rgba(0, 0, 0, .16);
  }

  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary);
  }

  &:hover {
    border-color: var(--color-200);
    border-top-color: var(--color-100);
    border-left-color: var(--color-100);
    border-right-color: var(--color-300);
    border-bottom-color: var(--color-300);
    transform: translateY(-2px);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, .06),
      0 4px 10px rgba(0, 0, 0, .10);

    &.active {
      border-color: var(--color-primary);
      box-shadow:
        0 0 0 1px var(--color-primary),
        0 1px 2px rgba(0, 0, 0, .06),
        0 4px 10px rgba(0, 0, 0, .10);
    }

    &::after {
      opacity: 1;
    }

    .hoverMask {
      opacity: 1;
    }
  }
}

.cover {
  position: relative;
  flex: none;
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: var(--color-primary-alpha-900);
  color: var(--color-primary-alpha-500);

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
  width: 28px;
  height: 28px;
  fill: currentColor;
}

.hoverMask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(18, 18, 18, .38);
  opacity: 0;
  transition: opacity @transition-fast;
}

.playBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: #fff;
  color: var(--color-1000);
  box-shadow: 0 1px 4px rgba(0, 0, 0, .25);
  cursor: pointer;

  svg {
    width: 11px;
    height: 11px;
    fill: currentColor;
  }

  &:hover {
    transform: scale(1.08);
  }
}

.info {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  padding: 7px 12px;
}

.title {
  flex: none;
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  color: var(--color-1000);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.songs {
  flex: none;
  margin: 0;
  padding: 0;
  list-style: none;
}

.song {
  display: flex;
  align-items: center;
  // 18 → 20：卡片高度 122 → 134，与参照稿的 133.6 对齐（行距参照稿实测 19.2px）
  height: 20px;
  font-size: 13px;
  line-height: 20px;
  color: var(--color-700);
}

.rank {
  flex: none;
  width: 15px;
  font-variant-numeric: tabular-nums;
}

.songText {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
