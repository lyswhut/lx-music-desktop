<template>
  <div :class="$style.container">
    <div v-if="listInfo.error" :class="$style.error" role="alert">
      <span>{{ listInfo.error }}</span>
      <base-btn min @click="handleRetry">{{ $t('retry') }}</base-btn>
    </div>
    <div :class="$style.results">
      <div v-show="!listInfo.noItemLabel" ref="domListRef" :class="$style.listContent" class="scroll">
        <ul>
          <li
            v-for="item in listInfo.list"
            :key="`${item.source}:${item.id}`"
            :class="$style.item"
          >
            <button
              type="button"
              :class="$style.itemBtn"
              @click="handleOpenItem(item)"
            >
              <div :class="[$style.cover, kind === 'artist' ? $style.avatar : '']">
                <img
                  v-if="item.img && !brokenImages.has(item.img)"
                  :class="$style.img"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  :src="item.img"
                  @error="markImageBroken(item.img)"
                >
                <div v-else :class="$style.placeholder" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <template v-if="kind === 'artist'">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
                    </template>
                    <template v-else>
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="2.5" />
                    </template>
                  </svg>
                </div>
              </div>
              <div :class="$style.desc">
                <h4 :title="item.name">{{ item.name }}</h4>
                <p v-if="kind === 'album' && item.singer" :class="$style.sub" :title="item.singer">{{ item.singer }}</p>
                <p v-if="kind === 'album' && item.publishTime" :class="$style.meta">{{ item.publishTime }}</p>
                <div :class="$style.info">
                  <span v-if="kind === 'artist' && item.songCount != null">{{ $t('search__artist_song_count', { count: item.songCount }) }}</span>
                  <span v-if="kind === 'artist' && item.albumCount != null">{{ $t('search__artist_album_count', { count: item.albumCount }) }}</span>
                  <span v-if="kind === 'album' && item.songCount != null">{{ $t('search__album_song_count', { count: item.songCount }) }}</span>
                  <span v-if="sourceId === 'all'" :class="$style.sourceBadge">{{ sourceNames[item.source] || item.source }}</span>
                </div>
              </div>
            </button>
          </li>
          <li v-for="idx in 6" :key="idx" :class="$style.itemSpacer" aria-hidden="true" />
        </ul>
        <div :class="$style.pagination">
          <material-pagination
            :count="listInfo.total"
            :limit="listInfo.limit"
            :page="listInfo.page"
            @btn-click="togglePage"
          />
        </div>
      </div>
      <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
        <div v-show="listInfo.noItemLabel" :class="$style.noitem">
          <p v-text="listInfo.noItemLabel" />
          <base-btn
            v-if="listInfo.page > 1 && !listInfo.list.length && listInfo.noItemLabel !== $t('list__loading')"
            :class="$style.backFirstBtn"
            min
            @click="togglePage(1)"
          >
            {{ $t('pagination__page', { num: 1 }) }}
          </base-btn>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, reactive, ref, watch } from '@common/utils/vueTools'
import { useRoute, useRouter } from '@common/utils/vueRouter'
import { sourceNames } from '@renderer/store'
import { searchText } from '@renderer/store/search/state'
import { addHistoryWord } from '@renderer/store/search/action'
import {
  cancelCatalogSearch,
  getCatalogSearchListInfo,
  searchCatalog,
  type CatalogSearchKind,
  type CatalogSearchListInfo,
  type CatalogSearchSource,
  type SearchCatalogItem,
} from '@renderer/store/search/catalog'
import { openCatalogTarget } from '@renderer/core/catalog'

interface Props {
  kind: CatalogSearchKind
  sourceId: CatalogSearchSource
  page: number
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()

const domListRef = ref<HTMLElement | null>(null)
const brokenImages = reactive(new Set<string>())
const createFallbackInfo = (): CatalogSearchListInfo => ({
  page: 1,
  limit: 20,
  total: 0,
  list: [],
  key: null,
  noItemLabel: '',
  error: '',
})
const listInfo = ref<CatalogSearchListInfo>(
  getCatalogSearchListInfo(props.kind, props.sourceId) ?? createFallbackInfo(),
)

const markImageBroken = (url: string) => {
  if (url) brokenImages.add(url)
}

let searchVersion = 0
const runSearch = async(kind: CatalogSearchKind, text: string, source: CatalogSearchSource, page: number) => {
  const version = ++searchVersion
  listInfo.value = getCatalogSearchListInfo(kind, source) ?? createFallbackInfo()
  if (text.trim().length) void addHistoryWord(text.trim()).catch(error => { console.log(error) })
  if (source === 'all' && text.trim().length) {
    // 聚合搜索渐进渲染：在 searchCatalog 隐藏容器前同步归顶一次，避免 YTM 延迟收敛或超时时将已滚动用户拉回顶部
    domListRef.value?.scrollTo({ top: 0 })
  }
  const list = await searchCatalog(kind, text, page || 1, source)
  if (version !== searchVersion) return
  if (source !== 'all' && list.length && domListRef.value) {
    void nextTick(() => {
      if (version === searchVersion) domListRef.value?.scrollTo({ top: 0 })
    })
  }
}

watch(
  () => [props.kind, props.sourceId, props.page, searchText.value] as const,
  ([kind, sourceId, page, text], _prev, onCleanup) => {
    listInfo.value = getCatalogSearchListInfo(kind, sourceId) ?? createFallbackInfo()
    void runSearch(kind, text, sourceId, page || 1)
    onCleanup(() => {
      searchVersion++
      cancelCatalogSearch(kind, sourceId)
    })
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  searchVersion++
  cancelCatalogSearch(props.kind, props.sourceId)
})

const handleRetry = () => {
  void runSearch(props.kind, searchText.value, props.sourceId, props.page || 1)
}

const togglePage = (nextPage: number) => {
  void router.replace({
    path: route.path,
    query: {
      ...route.query,
      page: nextPage,
    },
  })
}

const handleOpenItem = (item: SearchCatalogItem) => {
  // 咪咕暂未提供可用歌手曲目目录接口，点击咪咕歌手平滑跳转至该歌手的咪咕歌曲搜索
  if (props.kind === 'artist' && item.source === 'mg') {
    void router.replace({
      path: route.path,
      query: {
        ...route.query,
        source: 'mg',
        type: 'music',
        text: item.name,
        page: 1,
      },
    })
    return
  }
  openCatalogTarget({
    kind: props.kind,
    source: item.source,
    id: item.id,
    name: item.name,
  })
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  padding-top: 5px;
}

.results {
  position: relative;
  min-height: 0;
  flex: 1;
}

.error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 20px;
  flex: none;
  font-size: 12.5px;
  color: var(--color-font-label);
}

.listContent {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  font-size: 14px;
  box-sizing: border-box;
  padding: 16px 20px 0;

  ul {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    gap: 14px 0;
  }
}

.item {
  max-width: 360px;
  width: 32%;
  box-sizing: border-box;
  display: flex;
}

.itemBtn {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  text-align: left;
  font: inherit;
  color: inherit;
  padding: 10px;
  border-radius: var(--ui-radius-md);
  border: 1px solid transparent;
  background-color: transparent;
  cursor: pointer;
  transition: transform @transition-fast, background-color @transition-fast, border-color @transition-fast, box-shadow @transition-fast;
  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    background-color: var(--ui-surface-card);
    border-color: var(--ui-border-subtle);
    box-shadow: var(--ui-shadow-sm);
    outline: none;
  }
  &:focus-visible {
    border-color: var(--color-primary);
  }
}

.itemSpacer {
  max-width: 360px;
  width: 32%;
  height: 0;
  padding: 0;
  margin: 0;
  border: 0;
  pointer-events: none;
  cursor: default;
}

.cover {
  flex: none;
  width: 72px;
  height: 72px;
  border-radius: var(--ui-radius-sm);
  overflow: hidden;
  background-color: var(--ui-surface-subtle, rgba(128, 128, 128, 0.12));
  box-shadow: var(--ui-shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  border-radius: 50%;
}

.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  color: var(--color-font-label);
  opacity: 0.65;
  display: flex;
  align-items: center;
  justify-content: center;
}

.desc {
  flex: auto;
  min-width: 0;
  padding: 2px 4px 2px 12px;
  h4 {
    font-size: 13.5px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--color-font);
    .mixin-ellipsis-2();
  }
}

.sub {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.3;
  color: var(--color-font-label);
  .mixin-ellipsis-1();
}

.meta {
  margin-top: 3px;
  font-size: 11.5px;
  line-height: 1.2;
  color: var(--color-font-label);
  opacity: 0.85;
}

.info {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 11.5px;
  line-height: 1.2;
  color: var(--color-font-label);
}

.sourceBadge {
  padding: 1px 6px;
  border-radius: var(--ui-radius-pill, 999px);
  background-color: var(--ui-surface-subtle, rgba(128, 128, 128, 0.14));
  font-size: 11px;
}

.pagination {
  text-align: center;
  padding: 15px 0;
}

.noitem {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  p {
    font-size: 20px;
    color: var(--color-font-label);
  }
}

.backFirstBtn {
  margin-top: 12px;
}
</style>
