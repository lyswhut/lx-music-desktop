<template>
  <div :class="$style.container">
    <div v-if="listInfo.error" :class="$style.error" role="alert">
      <span>{{ listInfo.error }}</span>
      <button type="button" @click="search(searchText, props.sourceId, props.page || 1)">{{ $t('retry') }}</button>
    </div>
    <div :class="$style.results">
    <material-online-list
      ref="listRef"
      :page="listInfo.page"
      :limit="listInfo.limit"
      :total="listInfo.total"
      :list="listInfo.list"
      :no-item="listInfo.noItemLabel"
      :source-tag="sourceId == 'all'"
      check-api-source
      @toggle-page="handleTogglePage"
      @play-list="handlePlayList"
    />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from '@common/utils/vueTools'
import { searchText } from '@renderer/store/search/state'
import { cancelSearch } from '@renderer/store/search/music'
import { useRouter, useRoute } from '@common/utils/vueRouter'
import useList, { type SearchSource } from './useList'

interface Props {
  sourceId: SearchSource
  page: number
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()

const {
  listRef,
  listInfo,
  search,
  handlePlayList,
} = useList()

let pendingTimer: ReturnType<typeof setTimeout> | null = null
let activeSource: SearchSource = props.sourceId
const clearPendingTimer = () => {
  if (pendingTimer != null) {
    clearTimeout(pendingTimer)
    pendingTimer = null
  }
}
const scheduleSearch = (text: string, sourceId: SearchSource, page: number) => {
  clearPendingTimer()
  if (activeSource !== sourceId) {
    cancelSearch(activeSource)
    activeSource = sourceId
  }
  pendingTimer = setTimeout(() => {
    pendingTimer = null
    void search(text, sourceId, page || 1)
  })
}

watch(() => [props.sourceId, props.page], ([sourceId, page]) => {
  scheduleSearch(searchText.value, sourceId as SearchSource, (page as number) || 1)
})
watch(searchText, (text) => {
  scheduleSearch(text, props.sourceId, props.page)
}, {
  immediate: true,
})
onBeforeUnmount(() => {
  clearPendingTimer()
  cancelSearch(activeSource)
})

const handleTogglePage = (page: number) => {
  void router.replace({
    path: route.path,
    query: {
      ...route.query,
      page,
    },
  })
}


</script>


<style lang="less" module>
.container {
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.list {
  overflow: hidden;
  height: 100%;
  flex: auto;
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
  padding: 8px;
  flex: none;
}
</style>
