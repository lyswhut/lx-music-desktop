<template>
  <material-popup-btn ref="btnRef" :class="$style.btnContent">
    <button :class="$style.btn" :aria-label="$t('player__queue')" :disabled="!hasQueue" :title="$t('player__queue')">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
        <use xlink:href="#icon-list-order" />
      </svg>
      <span v-if="tempPlayList.length" :class="$style.badge">{{ tempPlayList.length > 99 ? '99+' : tempPlayList.length }}</span>
    </button>
    <template #content>
      <div :class="$style.queue">
        <div :class="$style.header">
          <div>
            <h3>{{ $t('player__queue') }}</h3>
            <p>{{ queueSummary }}</p>
          </div>
          <button
            v-if="tempPlayList.length"
            :class="$style.clearBtn"
            type="button"
            :aria-label="$t('player__queue_clear_play_later')"
            @click="handleClearPlayLater"
          >
            {{ $t('player__queue_clear_play_later') }}
          </button>
        </div>
        <div v-if="tempPlayList.length" :class="$style.section">
          <div :class="$style.sectionTitle">{{ $t('player__queue_play_later') }}</div>
          <button
            v-for="(item, index) in tempPlayList"
            :key="`later-${item.musicInfo.id}-${index}`"
            type="button"
            :class="$style.row"
            :aria-label="getMusicTitle(item.musicInfo)"
            @click="handlePlayLater(index)"
          >
            <span :class="[$style.index, $style.laterIndex]">{{ index + 1 }}</span>
            <span :class="$style.info">
              <span :class="$style.name">{{ getMusicName(item.musicInfo) }}</span>
              <span :class="$style.singer">{{ getMusicSinger(item.musicInfo) }}</span>
            </span>
            <span :class="$style.tag">{{ $t(index == 0 ? 'player__queue_next' : 'player__queue_later') }}</span>
          </button>
        </div>
        <div :class="$style.section">
          <div :class="$style.sectionTitle">{{ $t('player__queue_current_list') }}</div>
          <div v-if="!listQueue.length" :class="$style.empty">{{ $t('player__queue_empty') }}</div>
          <button
            v-for="item in listQueue"
            :key="`list-${item.index}-${item.musicInfo.id}`"
            type="button"
            :class="[$style.row, {[$style.active]: item.isCurrent}]"
            :aria-label="getMusicTitle(item.musicInfo)"
            @click="handlePlayList(item.index)"
          >
            <span :class="$style.index">{{ item.index + 1 }}</span>
            <span :class="$style.info">
              <span :class="$style.name">{{ getMusicName(item.musicInfo) }}</span>
              <span :class="$style.singer">{{ getMusicSinger(item.musicInfo) }}</span>
            </span>
            <span v-if="item.isCurrent" :class="$style.tag">{{ $t('player__queue_now') }}</span>
            <span v-else-if="item.offset == -1" :class="$style.tag">{{ $t('player__queue_prev') }}</span>
            <span v-else-if="item.offset == 1 && !tempPlayList.length && appSetting['player.togglePlayMethod'] != 'random'" :class="$style.tag">{{ $t('player__queue_next') }}</span>
          </button>
        </div>
      </div>
    </template>
  </material-popup-btn>
</template>

<script setup lang="ts">
import { computed, ref } from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'
import { playInfo, playMusicInfo, tempPlayList } from '@renderer/store/player/state'
import { clearTempPlayeList, getList, removeTempPlayList } from '@renderer/store/player/action'
import { playList, playNext } from '@renderer/core/player'
import { appSetting } from '@renderer/store/setting'

const btnRef = ref<any>(null)
const t = useI18n()
const adjacentCount = 4

const playerList = computed(() => getList(playInfo.playerListId))

const hasQueue = computed(() => {
  return !!playMusicInfo.musicInfo || tempPlayList.length > 0 || playerList.value.length > 0
})

const currentListIndex = computed(() => {
  const list = playerList.value
  if (!list.length) return -1
  if (playInfo.playerPlayIndex > -1) return Math.min(playInfo.playerPlayIndex, list.length - 1)
  if (!playMusicInfo.musicInfo) return -1
  return list.findIndex(item => item.id == playMusicInfo.musicInfo?.id)
})

const listQueue = computed(() => {
  const list = playerList.value
  if (!list.length) return []

  const index = currentListIndex.value < 0 ? 0 : currentListIndex.value
  const start = Math.max(0, index - adjacentCount)
  const end = Math.min(list.length, index + adjacentCount + 1)

  return list.slice(start, end).map((musicInfo, offsetIndex) => {
    const musicIndex = start + offsetIndex
    return {
      musicInfo,
      index: musicIndex,
      offset: musicIndex - index,
      isCurrent: musicIndex == index && !!playMusicInfo.musicInfo && !playMusicInfo.isTempPlay,
    }
  })
})

const queueSummary = computed(() => {
  const total = playerList.value.length
  const playLaterCount = tempPlayList.length
  if (!total && !playLaterCount) return t('player__queue_empty')
  if (!total) return t('player__queue_summary_later', { num: playLaterCount })
  if (currentListIndex.value < 0) return t('player__queue_summary_list', { total, num: playLaterCount })
  return t('player__queue_summary', {
    index: currentListIndex.value + 1,
    total,
    num: playLaterCount,
  })
})

const getMusicName = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => {
  return 'progress' in musicInfo ? musicInfo.metadata.musicInfo.name : musicInfo.name
}

const getMusicSinger = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => {
  return 'progress' in musicInfo ? musicInfo.metadata.musicInfo.singer : musicInfo.singer
}

const getMusicTitle = (musicInfo: LX.Music.MusicInfo | LX.Download.ListItem) => {
  return `${getMusicName(musicInfo)} - ${getMusicSinger(musicInfo)}`
}

const hidePopup = () => {
  btnRef.value?.hide()
}

const handlePlayList = (index: number) => {
  const listId = playInfo.playerListId
  if (!listId) return
  hidePopup()
  playList(listId, index)
}

const handlePlayLater = (index: number) => {
  if (index < 0 || index >= tempPlayList.length) return
  while (index > 0) {
    removeTempPlayList(0)
    index--
  }
  hidePopup()
  void playNext()
}

const handleClearPlayLater = () => {
  clearTempPlayeList()
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.btnContent {
  flex: none;
  height: 100%;
}

.btn {
  position: relative;
  width: 24px;
  height: 100%;
  padding: 0;
  border: none;
  color: var(--color-button-font);
  background-color: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    cursor: default;
    opacity: .35;
  }

  svg {
    opacity: .6;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
    transition: opacity @transition-fast;
  }

  &:not(:disabled):hover svg {
    opacity: .9;
  }

  &:not(:disabled):active svg {
    opacity: 1;
  }
}

.badge {
  position: absolute;
  right: -7px;
  top: 8px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 7px;
  background-color: var(--color-primary);
  color: var(--color-000);
  font-size: 10px;
  line-height: 14px;
  text-align: center;
  box-sizing: border-box;
}

.queue {
  width: 360px;
  max-width: 78vw;
  color: var(--color-font);
  font-size: 12px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-primary-alpha-900);

  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
  }

  p {
    margin: 2px 0 0;
    color: var(--color-font-label);
    line-height: 1.5;
  }
}

.clearBtn {
  flex: none;
  border: none;
  border-radius: @form-radius;
  background-color: transparent;
  color: var(--color-button-font);
  cursor: pointer;
  padding: 4px 7px;
  font-size: 12px;

  &:hover {
    background-color: var(--color-button-background-hover);
  }

  &:active {
    background-color: var(--color-button-background-active);
  }
}

.section {
  padding-top: 10px;
}

.sectionTitle {
  color: var(--color-font-label);
  font-size: 12px;
  line-height: 1.5;
  padding: 0 6px 4px;
}

.row {
  width: 100%;
  height: 38px;
  border: none;
  border-radius: @radius-border;
  background-color: transparent;
  color: var(--color-font);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 7px;
  text-align: left;
  transition: background-color @transition-fast;

  &:hover {
    background-color: var(--color-primary-background-hover);
  }

  &:active {
    background-color: var(--color-primary-background-active);
  }
}

.active {
  background-color: var(--color-primary-alpha-900);
  color: var(--color-primary);
}

.index {
  flex: none;
  width: 28px;
  color: var(--color-font-label);
  text-align: right;
  .mixin-ellipsis-1();
}

.laterIndex {
  color: var(--color-primary);
}

.info {
  min-width: 0;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  gap: 2px;
}

.name,
.singer {
  display: block;
  .mixin-ellipsis-1();
}

.name {
  font-size: 12px;
  color: inherit;
}

.singer {
  font-size: 11px;
  color: var(--color-font-label);
}

.tag {
  flex: none;
  max-width: 54px;
  color: var(--color-primary);
  font-size: 11px;
  .mixin-ellipsis-1();
}

.empty {
  padding: 18px 6px;
  color: var(--color-font-label);
  text-align: center;
}

</style>
