<template>
  <div :class="$style.boardBar">
    <BoardCard
      v-for="item in list"
      :key="item.id"
      :item="item"
      :active="item.id == boardId"
      @select="handleSelectBoard"
      @play="handlePlayBoard"
    />
  </div>
  <base-menu
    v-model="isShowMenu"
    :menus="menus"
    :xy="menuLocation"
    item-name="name"
    @menu-click="handleMenuClick"
  />
</template>

<script setup>
import { watch, shallowReactive } from '@common/utils/vueTools'
import { getBoardsList, setBoard } from '@renderer/store/leaderboard/action'
import { boards } from '@renderer/store/leaderboard/state'
import { playSongListDetail } from '../action'
import useMenu from './useMenu'
import { useRouter, useRoute } from '@common/utils/vueRouter'
import BoardCard from './BoardCard.vue'

const props = defineProps({
  source: {
    type: String,
    required: true,
  },
  boardId: {
    type: [String, undefined],
    default: undefined,
  },
})

const emit = defineEmits(['show-menu', 'board-change'])

const router = useRouter()
const route = useRoute()

const list = shallowReactive([])

const handleToggleList = (id) => {
  void router.replace({
    path: route.path,
    query: {
      source: props.source,
      boardId: id,
    },
  })
}

const handleSelectBoard = (id) => {
  handleToggleList(id)
  emit('board-change')
}

const handlePlayBoard = (id) => {
  handleToggleList(id)
  emit('board-change')
  void playSongListDetail(id)
}

const {
  menus,
  menuLocation,
  isShowMenu,
  menuClick,
} = useMenu({ emit, list })

const handleMenuClick = () => {
  menuClick()
}


watch(() => props.source, async(source) => {
  // const source = (await getLeaderboardSetting()).source as LX.OnlineSource
  let boardList = boards[source]
  if (boardList == null) setBoard(boardList = await getBoardsList(source), source)
  list.splice(0, list.length, ...boardList.list)
  if (!props.boardId && boardList.list.length) handleToggleList(boardList.list[0].id)
}, {
  immediate: true,
})

defineExpose({ hideMenu: handleMenuClick })

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.boardBar {
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: max-content;
  // 列间距与左右内边距各收一档，三列时单卡宽度才能到 ~292px（参照稿 295px）
  gap: 16px 12px;
  padding: 16px 12px;
  box-sizing: border-box;
}
</style>
