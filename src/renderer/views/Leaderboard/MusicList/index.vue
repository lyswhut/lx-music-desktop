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
    />
  </div>
</template>

<script setup lang="ts">
import { watch } from '@common/utils/vueTools'
import { clearListDetail } from '@renderer/store/leaderboard/action'
import { getLiveYtmContextKey } from '@renderer/utils/musicSdk/ytm/runtimeContext'
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

watch(() => [props.source, props.boardId, props.source === 'ytm' ? getLiveYtmContextKey() : ''] as const, ([source, boardId]) => {
  if (!boardId || !boardId.startsWith(`${source}__`)) {
    // 无论此前是否已提交过详情（含 listDetailInfo.source 仍为 null 的首载在途态），切源无有效 boardId 时一律作废旧详情请求；
    // 若同 tick 先执行的 BoardList 已清空详情并置入等待/空目录提示，则透传保留该提示避免闪白
    const keepLabel = !listDetailInfo.key && !listDetailInfo.source && !listDetailInfo.list.length &&
      (listDetailInfo.noItemLabel === window.i18n.t('list__loading') || listDetailInfo.noItemLabel === window.i18n.t('no_item'))
      ? listDetailInfo.noItemLabel
      : ''
    clearListDetail(keepLabel)
    return
  }
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

defineExpose({ hideMenu })


</script>


<style lang="less" module>
.container {
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

</style>
