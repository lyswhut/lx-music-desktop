<template>
  <div :class="$style.container">
    <material-online-list
      ref="listRef"
      :page="listDetailInfo.page"
      :limit="listDetailInfo.limit"
      :total="listDetailInfo.total"
      :list="listDetailInfo.list"
      :no-item="listDetailInfo.noItemLabel"
      @show-menu="hideListsMenu"
      @play-list="handlePlayList"
      @toggle-page="togglePage"
      @scroll="handleScroll"
    />
    <div v-if="showScrollTopBtn" :class="$style.scrollTopBtn" @click="scrollToTop">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from '@common/utils/vueTools'
import useList from './useList'


const props = defineProps<{
  source: LX.OnlineSource
  boardId?: string
}>()

const emit = defineEmits(['show-menu'])

const {
  listRef,
  listDetailInfo,
  getList,
  handlePlayList,
} = useList()

watch(() => props.boardId, (boardId) => {
  if (!boardId) return
  getList(boardId, 1)
}, {
  immediate: true,
})


const hideListsMenu = () => {
  emit('show-menu')
}

const togglePage = (page: number) => {
  getList(listDetailInfo.id, page)
}

const hideMenu = () => {
  listRef.value.handleMenuClick()
}

const showScrollTopBtn = ref(false)

const scrollToTop = () => {
  if (listRef.value) {
    listRef.value.scrollToTop()
  }
}

const handleScroll = () => {
  if (listRef.value) {
    showScrollTopBtn.value = listRef.value.getScrollTop() > 100
  }
}

defineExpose({ hideMenu })


</script>


<style lang="less" module>
.container {
  position: relative;
  width: 100%;
  flex: auto;
  display: block;
}

.list {
  overflow: hidden;
  height: 100%;
  flex: auto;
}

.scrollTopBtn {
  position: fixed !important;
  right: 24px !important;
  bottom: 80px !important;
  width: 44px !important;
  height: 44px !important;
  border-radius: 50% !important;
  background-color: #42b883 !important;
  color: #ffffff !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  box-shadow: 0 4px 16px rgba(66, 184, 131, 0.4) !important;
  z-index: 99999 !important;
  transition: background-color 0.2s ease !important;

  &:hover {
    background-color: #36a070 !important;
  }

  svg {
    width: 24px;
    height: 24px;
  }
}
</style>
