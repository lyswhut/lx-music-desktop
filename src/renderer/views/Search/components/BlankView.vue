<template>
  <transition enter-active-class="animated-fast fadeIn" leave-active-class="animated-fast fadeOut">
    <div v-show="props.visible" :class="$style.noitem">
      <div :class="$style.columns">
        <section>
          <div class="section-head">
            <h2>{{ $t('search__hot_search') }}</h2>
            <span>{{ sourceLabel }}</span>
          </div>
          <div v-if="showHot && hotSearchList.length" class="hot-list">
            <button
              v-for="(item, index) in hotSearchList"
              :key="index + item"
              type="button"
              class="hot-item"
              @click="handleSearch(item)"
            >
              <span class="hot-item-rank">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="hot-item-body">
                <strong class="hot-item-title">{{ item }}</strong>
              </span>
              <span class="hot-item-tag">{{ $t('search__hot_action') }}</span>
            </button>
          </div>
        </section>
        <section>
          <div class="section-head">
            <h2>{{ $t('history_search') }}</h2>
            <span
              v-if="showHistory && historyList.length"
              :class="$style.historyClearBtn"
              :aria-label="$t('history_clear')"
              @click="clearHistoryList"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <use xlink:href="#icon-line-trash" />
              </svg>
            </span>
          </div>
          <div v-if="showHistory && historyList.length" :class="$style.historyList">
            <div v-for="(item, index) in historyList" :key="index + item" class="history-chip" :class="$style.historyItem">
              <button type="button" :class="$style.historyWord" @click="handleSearch(item)">{{ item }}</button>
              <button type="button" :class="$style.historyRemove" :aria-label="$t('history_remove')" @click.stop="removeHistoryWord(index)">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" space="preserve">
                  <use xlink:href="#icon-window-close" />
                </svg>
              </button>
            </div>
          </div>
          <p v-else-if="showHistory" :class="$style.hint">{{ $t('search__history_empty') }}</p>
        </section>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { watch, shallowRef, computed } from '@common/utils/vueTools'
import { historyList } from '@renderer/store/search/state'
import { getHistoryList, removeHistoryWord, clearHistoryList } from '@renderer/store/search/action'
import { getList } from '@renderer/store/hotSearch'
import { useRouter } from '@common/utils/vueRouter'
import { sourceNames } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'

const props = defineProps({
  visible: Boolean,
  source: {
    type: String,
    required: true,
  },
})

const hotSearchList = shallowRef([])
const sourceLabel = computed(() => sourceNames.value[props.source] ?? '')
const showHot = computed(() => appSetting['search.isShowHotSearch'])
const showHistory = computed(() => appSetting['search.isShowHistorySearch'])

const loadHot = (source) => {
  if (!props.visible || !showHot.value) {
    hotSearchList.value = []
    return
  }
  void getList(source).then(list => {
    if (source != props.source) return
    hotSearchList.value = list
  }).catch(() => {
    if (source != props.source) return
    hotSearchList.value = []
  })
}

watch([() => props.visible, () => props.source, showHot], () => {
  loadHot(props.source)
}, {
  immediate: true,
})

watch([() => props.visible, showHistory], ([visible, historyOn]) => {
  if (visible && historyOn) void getHistoryList()
}, {
  immediate: true,
})

const router = useRouter()
const handleSearch = (text) => {
  void router.replace({
    path: '/search',
    query: {
      text,
      source: props.source,
    },
  })
}

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.noitem {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  overflow: auto;
  display: flex;
  flex-flow: column nowrap;
}

.columns {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 44px;
  padding: 32px 0 24px;
  min-height: 250px;
}

.historyList {
  display: flex;
  flex-flow: row wrap;
  gap: 8px;
}

.historyItem {
  &:hover {
    .historyRemove {
      opacity: 1;
    }
  }
}

.historyWord {
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  font-size: 11px;
  color: inherit;
  cursor: pointer;
  .mixin-ellipsis-1();
}

.historyRemove {
  flex: none;
  width: 14px;
  height: 14px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-secondary);
  opacity: .55;
  cursor: pointer;
  svg {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: currentColor;
  }
}

.historyClearBtn {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  padding: 0;
  border-radius: 50%;
  color: var(--color-secondary);
  cursor: pointer;
  opacity: .7;
  &:hover {
    color: var(--color-primary);
    opacity: 1;
    background: var(--color-well);
  }
  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
  }
}

.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--color-secondary);
}

.noitem_label {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  p {
    font-size: 24px;
    color: var(--color-secondary);
    text-align: center;
  }
}

@media (max-width: 920px) {
  .columns {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
}
</style>
