<template>
  <div :class="$style.container">
    <div :class="$style.head">
      <h2>{{ boardName }}</h2>
      <div :class="$style.tools">
        <base-btn primary :class="$style.play" :disabled="!listDetailInfo.list.length" @click="playAll">
          <svg :class="$style.toolIcon" viewBox="0 0 24 24" aria-hidden="true"><use xlink:href="#icon-line-play-fill" /></svg>
          {{ $t('list__play') }}
        </base-btn>
        <base-btn outline :class="$style.collect" :disabled="!props.boardId" @click="collect">
          <svg :class="$style.toolIcon" viewBox="0 0 24 24" aria-hidden="true"><use xlink:href="#icon-line-plus" /></svg>
          {{ $t('list__collect') }}
        </base-btn>
      </div>
    </div>
    <div :class="$style.listWrap">
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
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from '@common/utils/vueTools'
import useList from './useList'
import { boards } from '@renderer/store/leaderboard/state'
import { addSongListDetail, playSongListDetail } from '../action'


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


const boardName = computed(() => {
  const list = boards[props.source as LX.OnlineSource]?.list ?? []
  return list.find((item: { id: string, name: string }) => item.id == props.boardId)?.name ?? ''
})

const playAll = () => {
  if (!listDetailInfo.id || !listDetailInfo.list.length) return
  void playSongListDetail(listDetailInfo.id, listDetailInfo.list, 0)
}

const collect = () => {
  if (!props.boardId) return
  void addSongListDetail(props.boardId, boardName.value, props.source)
}

const hideListsMenu = () => {
  emit('show-menu')
}

const togglePage = (page: number) => {
  getList(listDetailInfo.id, page)
}

const hideMenu = () => {
  listRef.value.handleMenuClick()
}

defineExpose({ hideMenu })


</script>


<style lang="less" module>
.container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}
.head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  min-width: 0;
  h2 {
    margin: 0;
    min-width: 0;
    font-size: 16px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.tools {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.play,
.collect {
  padding: 0 15px;
}
.toolIcon {
  width: 16px;
  height: 16px;
  margin-right: 7px;
  fill: currentColor;
  stroke: none;
  vertical-align: -3px;
}
.listWrap {
  position: relative;
  flex: auto;
  min-height: 0;
  :global {
    .thead th {
      font-size: 10px;
      font-weight: 450;
      line-height: 32px;
      padding: 0 10px;
      color: var(--color-secondary, var(--color-font-label));
    }
    .list .list-item {
      font-size: 12px;
    }
    .list-item-art {
      width: 38px;
      height: 38px;
      border-radius: 5px;
    }
    .list-item-cell.name {
      gap: 11px;
    }
    .list-item-cell.num,
    .list-item-cell .num {
      font-size: 11px;
      color: var(--color-secondary, var(--color-font-label));
    }
    .thead th:nth-child(4),
    .list-item-cell:nth-child(4) {
      display: none !important;
    }
  }
}

.list {
  overflow: hidden;
  height: 100%;
  flex: auto;
}

</style>
