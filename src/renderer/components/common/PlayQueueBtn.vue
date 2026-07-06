<template>
  <div :class="$style.btnContent">
    <button ref="dom_btn" :class="$style.btn" :aria-label="$t('player__play_queue')" @click="handleTogglePopup">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 32 32" space="preserve">
        <use xlink:href="#icon-list-order" />
      </svg>
    </button>
    <base-popup v-model:visible="visible" :btn-el="dom_btn">
      <div :class="$style.popup">
        <div v-if="!queueSections.length" :class="$style.empty">{{ $t('player__queue_empty') }}</div>
        <template v-else>
          <section v-if="tempSection" :class="$style.section">
            <div :class="$style.sectionHeader">
              <div :class="$style.sectionTitle">
                <span>{{ getSectionTitle(tempSection.key) }}</span>
                <span :class="$style.sectionCount">{{ tempSection.items.length }}</span>
              </div>
              <button
                v-if="tempSection.items.length"
                type="button"
                :class="[$style.clearBtn, $style.noDrag]"
                :aria-label="$t('player__queue_clear')"
                @click.stop="handleClearTempQueue"
              >
                {{ $t('player__queue_clear') }}
              </button>
            </div>
            <ul ref="dom_tempList" :class="$style.list">
              <li
                v-for="item in tempSection.items" :key="item.key"
                :class="[$style.item, { [$style.active]: item.isActive }]"
                @click="handlePlayItem(tempSection.key, item.index)"
              >
                <div :class="$style.itemMain">
                  <div :class="[$style.itemIcon, $style.dragHandle]">
                    <svg v-if="item.isActive" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 1024 1024" space="preserve">
                      <use xlink:href="#icon-play" />
                    </svg>
                    <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 32 32" space="preserve">
                      <use xlink:href="#icon-list-order" />
                    </svg>
                  </div>
                  <div :class="$style.itemText">
                    <div :class="$style.itemName">{{ item.musicInfo.name }}</div>
                    <div :class="$style.itemMeta">{{ item.musicInfo.singer }}</div>
                  </div>
                </div>
                <button
                  v-if="item.canRemove"
                  type="button"
                  :class="[$style.itemAction, $style.noDrag]"
                  :aria-label="$t('list__remove')"
                  @click.stop="handleRemoveTempItem(item.index)"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 24 24" space="preserve">
                    <use xlink:href="#icon-close" />
                  </svg>
                </button>
              </li>
            </ul>
          </section>
          <section v-if="baseSection" :class="$style.section">
            <div :class="$style.sectionHeader">
              <div :class="$style.sectionTitle">
                <span>{{ getSectionTitle(baseSection.key) }}</span>
                <span :class="$style.sectionCount">{{ baseSection.items.length }}</span>
              </div>
            </div>
            <ul :class="$style.list">
              <li
                v-for="item in baseSection.items" :key="item.key"
                :class="[$style.item, { [$style.active]: item.isActive }]"
                @click="handlePlayItem(baseSection.key, item.index)"
              >
                <div :class="$style.itemMain">
                  <div :class="$style.itemIcon">
                    <svg v-if="item.isActive" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" width="100%" viewBox="0 0 1024 1024" space="preserve">
                      <use xlink:href="#icon-play" />
                    </svg>
                    <span v-else>{{ item.index + 1 }}</span>
                  </div>
                  <div :class="$style.itemText">
                    <div :class="$style.itemName">{{ item.musicInfo.name }}</div>
                    <div :class="$style.itemMeta">{{ item.musicInfo.singer }}</div>
                  </div>
                </div>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </base-popup>
  </div>
</template>

<script setup>
import Sortable, { AutoScroll } from 'sortablejs/modular/sortable.core.esm'
import { computed, ref, watch, onBeforeUnmount, useCssModule } from '@common/utils/vueTools'
import { playList, playTempPlayItem } from '@renderer/core/player'
import { buildPlayQueueSections } from '@renderer/core/player/queue.mjs'
import {
  getList,
  clearTempPlayeList,
  moveTempPlayList,
  removeTempPlayList,
  setShowPlayQueue,
} from '@renderer/store/player/action'
import {
  isShowPlayQueue,
  playInfo,
  playMusicInfo,
  tempPlayList,
} from '@renderer/store/player/state'

if (!window.__lx_sortableAutoScrollMounted) {
  Sortable.mount(new AutoScroll())
  window.__lx_sortableAutoScrollMounted = true
}

const styles = useCssModule()
const dom_btn = ref(null)
const dom_tempList = ref(null)
let sortable = null
let suppressPlayUntil = 0

const visible = computed({
  get: () => isShowPlayQueue.value,
  set: (value) => {
    setShowPlayQueue(value)
  },
})

const baseList = ref([])

const queueSections = computed(() => {
  return buildPlayQueueSections({
    tempPlayList,
    baseList: baseList.value,
    baseListId: playInfo.playerListId,
    playMusicInfo,
  })
})

const tempSection = computed(() => queueSections.value.find(section => section.key === 'temp') ?? null)
const baseSection = computed(() => queueSections.value.find(section => section.key === 'base') ?? null)

const updateSortableStatus = (isVisible = visible.value, tempCount = tempPlayList.length) => {
  if (!sortable) return
  sortable.option('disabled', !(isVisible && tempCount > 1))
}

function refreshBaseList() {
  baseList.value = getList(playInfo.playerListId)
}

watch(dom_tempList, (element) => {
  if (sortable) {
    sortable.destroy()
    sortable = null
  }
  if (!element) return

  sortable = Sortable.create(element, {
    animation: 150,
    disabled: true,
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 4,
    filter: `.${styles.noDrag}`,
    handle: `.${styles.dragHandle}`,
    ghostClass: styles.dragingItem,
    onStart() {
      window.app_event.dragStart()
    },
    onEnd(event) {
      if (event.oldIndex != null && event.newIndex != null && event.oldIndex !== event.newIndex) {
        moveTempPlayList(event.oldIndex, event.newIndex)
      }
      suppressPlayUntil = Date.now() + 200
      window.app_event.dragEnd()
    },
  })
  updateSortableStatus()
})

watch([visible, () => tempPlayList.length], ([isVisible, tempCount]) => {
  updateSortableStatus(isVisible, tempCount)
})

watch(visible, (isVisible) => {
  if (isVisible) {
    refreshBaseList()
  }
})

watch(() => playInfo.playerListId, () => {
  refreshBaseList()
}, {
  immediate: true,
})

let popupTimeout = null
const handleTogglePopup = (event) => {
  if (popupTimeout) {
    clearTimeout(popupTimeout)
    popupTimeout = null
  }
  if (visible.value) {
    event.stopPropagation()
    visible.value = false
    return
  }
  popupTimeout = setTimeout(() => {
    popupTimeout = null
    visible.value = true
  }, 60)
}

const getSectionTitle = (key) => {
  switch (key) {
    case 'temp':
      return window.i18n.t('player__queue_temp')
    default:
      return window.i18n.t('player__queue_current')
  }
}

const handlePlayItem = (sectionKey, index) => {
  if (Date.now() < suppressPlayUntil) return
  if (sectionKey === 'temp') {
    playTempPlayItem(index)
  } else if (playInfo.playerListId) {
    playList(playInfo.playerListId, index)
  }
  visible.value = false
}

const handleRemoveTempItem = (index) => {
  removeTempPlayList(index)
}

const handleClearTempQueue = () => {
  clearTempPlayeList()
}

const handleMyListUpdate = (ids) => {
  if (!playInfo.playerListId || !ids.includes(playInfo.playerListId)) return
  refreshBaseList()
}

window.app_event.on('myListUpdate', handleMyListUpdate)

onBeforeUnmount(() => {
  window.app_event.off('myListUpdate', handleMyListUpdate)
  if (popupTimeout) clearTimeout(popupTimeout)
  if (sortable) sortable.destroy()
})
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.btnContent {
  flex: none;
  height: 100%;
  position: relative;
}

.btn {
  justify-content: center;
  align-items: center;
  transition: color @transition-normal;
  cursor: pointer;
  background-color: transparent;
  border: none;
  width: 24px;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  padding: 0;

  svg {
    transition: opacity @transition-fast;
    opacity: .6;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
  }

  &:hover svg {
    opacity: .9;
  }

  &:active svg {
    opacity: 1;
  }
}

.popup {
  width: 320px;
  max-width: 80vw;
  display: flex;
  flex-flow: column nowrap;
  gap: 10px;
}

.empty {
  padding: 14px 10px;
  text-align: center;
  font-size: 13px;
  color: var(--color-font-label);
}

.section {
  display: flex;
  flex-flow: column nowrap;
  gap: 6px;
}

.sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sectionTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-font-label);
}

.sectionCount {
  color: var(--color-primary);
}

.clearBtn {
  background: transparent;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.list {
  display: flex;
  flex-flow: column nowrap;
  gap: 4px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 40px;
  padding: 8px 10px;
  border-radius: @radius-border;
  cursor: pointer;
  transition: @transition-fast;
  transition-property: background-color, color, opacity;
  color: var(--color-font);

  &:hover {
    background-color: var(--color-primary-light-900-alpha-100);
  }
}

.active {
  background-color: var(--color-primary-light-900-alpha-200);
  color: var(--color-button-font);
}

.itemMain {
  min-width: 0;
  flex: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.itemIcon {
  flex: none;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  opacity: .8;

  svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }
}

.dragHandle {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.itemText {
  min-width: 0;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  gap: 2px;
}

.itemName,
.itemMeta {
  .mixin-ellipsis-1();
}

.itemName {
  font-size: 13px;
}

.itemMeta {
  font-size: 12px;
  color: var(--color-font-label);
}

.active .itemMeta {
  color: inherit;
  opacity: .85;
}

.itemAction {
  flex: none;
  width: 18px;
  height: 18px;
  padding: 0;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: .6;

  svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  &:hover {
    opacity: 1;
  }
}

.noDrag {
  user-select: none;
}

.dragingItem {
  opacity: .35;
}
</style>
