<template>
  <aside v-if="isShowQueue" :class="$style.pane" aria-label="稍后播放">
    <header :class="$style.head">
      <h2>{{ $t('player__queue') }}</h2>
      <span :class="$style.count">{{ tempPlayList.length }}</span>
      <button type="button" :class="$style.close" :aria-label="$t('player__queue_close')" @click="setShowQueue(false)">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="14" viewBox="0 0 212.982 212.982" space="preserve">
          <use xlink:href="#icon-delete" />
        </svg>
      </button>
    </header>
    <div v-if="playMusicInfo.musicInfo" :class="$style.now">
      <img v-if="musicInfo.pic" :class="$style.nowArt" :src="musicInfo.pic" alt="">
      <div :class="$style.nowCopy">
        <span :class="$style.nowLabel">{{ $t('player__queue_now') }}</span>
        <strong :class="$style.name">{{ currentName }}</strong>
        <span :class="$style.meta">{{ currentSinger }}</span>
      </div>
    </div>
    <ul v-if="tempPlayList.length" :class="[$style.list, 'scroll']">
      <li v-for="(item, index) in tempPlayList" :key="item.musicInfo.id + '-' + index" :class="$style.item">
        <button type="button" :class="$style.play" :aria-label="$t('player__play')" @click="playAt(index)">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="12" viewBox="0 0 1024 1024" space="preserve">
            <use xlink:href="#icon-play" />
          </svg>
        </button>
        <div :class="$style.info">
          <strong :class="$style.name">{{ getName(item.musicInfo) }}</strong>
          <span :class="$style.meta">{{ getSinger(item.musicInfo) }}</span>
        </div>
        <div :class="$style.actions">
          <button type="button" :disabled="index == 0" aria-label="上移" @click="moveTempPlayList(index, index - 1)">↑</button>
          <button type="button" :disabled="index == tempPlayList.length - 1" aria-label="下移" @click="moveTempPlayList(index, index + 1)">↓</button>
          <button type="button" :aria-label="$t('lists__remove')" @click="removeTempPlayList(index)">×</button>
        </div>
      </li>
    </ul>
    <div v-else :class="$style.empty">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 425.2 425.2" space="preserve">
        <use xlink:href="#icon-album" />
      </svg>
      <h3>{{ $t('player__queue_empty') }}</h3>
      <p>{{ $t('player__queue_empty_hint') }}</p>
    </div>
  </aside>
</template>

<script setup>
import { computed } from '@common/utils/vueTools'
import { isShowQueue, tempPlayList, playMusicInfo, musicInfo } from '@renderer/store/player/state'
import { setShowQueue, removeTempPlayList, moveTempPlayList } from '@renderer/store/player/action'
import { playNext } from '@renderer/core/player'

const currentName = computed(() => musicInfo.name || '')
const currentSinger = computed(() => musicInfo.singer || '')

const getName = (info) => {
  return 'progress' in info ? info.metadata.musicInfo.name : info.name
}
const getSinger = (info) => {
  return 'progress' in info ? info.metadata.musicInfo.singer : info.singer
}

const playAt = (index) => {
  if (index > 0) {
    const [item] = tempPlayList.splice(index, 1)
    tempPlayList.unshift(item)
  }
  void playNext()
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.pane {
  position: absolute;
  top: @height-toolbar;
  right: 0;
  bottom: 0;
  width: 320px;
  z-index: 8;
  display: flex;
  flex-flow: column nowrap;
  background: var(--color-glass, var(--color-main-background));
  backdrop-filter: blur(24px) saturate(1.15);
  border-left: 1px solid var(--color-primary-alpha-900);
  box-shadow: -8px 0 24px rgba(21, 52, 44, 0.08);
}

.head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  height: auto;
  min-height: 48px;
  padding: 16px;
  border-bottom: 1px solid var(--color-primary-alpha-900);

  h2 {
    flex: auto;
    font-size: 13px;
    font-weight: 650;
    margin: 0;
  }
}

.count {
  font-size: 11px;
  color: var(--color-font-label);
}

.close {
  border: none;
  background: none;
  color: var(--color-button-font);
  width: 28px;
  height: 28px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: var(--color-button-background-hover);
  }
}

.now {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-primary-alpha-900);
}
.nowArt {
  flex: none;
  width: 37px;
  height: 37px;
  border-radius: 6px;
  object-fit: cover;
}
.nowCopy {
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
  gap: 2px;
}

.nowLabel {
  font-size: 11px;
  color: var(--color-primary);
}

.list {
  flex: auto;
  min-height: 0;
  margin: 0;
  padding: 8px;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
  padding: 6px 8px;
  border-radius: 8px;
  &:hover {
    background-color: var(--color-primary-background-hover);
  }
}

.play {
  flex: none;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background-color: var(--color-button-background);
  color: var(--color-button-font);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info {
  flex: auto;
  min-width: 0;
  display: flex;
  flex-flow: column nowrap;
}

.name {
  font-size: 11px;
  font-weight: 600;
  .mixin-ellipsis-1();
}

.meta {
  font-size: 10px;
  color: var(--color-font-label);
  .mixin-ellipsis-1();
}

.actions {
  flex: none;
  display: flex;
  gap: 2px;
  button {
    width: 22px;
    height: 22px;
    border: none;
    background: none;
    color: var(--color-font-label);
    border-radius: 6px;
    cursor: pointer;
    &:disabled {
      opacity: .3;
      cursor: default;
    }
    &:hover:not(:disabled) {
      background-color: var(--color-button-background-hover);
    }
  }
}

.empty {
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  margin: 0;
  padding: 24px;
  gap: 10px;
  text-align: center;

  svg {
    width: 34px;
    height: 34px;
    color: var(--color-font-label);
    fill: currentColor;
    margin-bottom: 4px;
  }
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 650;
    line-height: 1.4;
  }
  p {
    margin: 0;
    max-width: 360px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--color-font-label);
  }
}
</style>
