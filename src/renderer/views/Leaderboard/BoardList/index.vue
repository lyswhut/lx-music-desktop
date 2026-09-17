<template>
  <ul ref="dom_lists_list" class="scroll" :class="$style.listsContent">
    <li
      v-for="(item, index) in list"
      :key="item.id"
      class="board-choice"
      :class="[{ active: item.id == boardId }, { [$style.clicked]: rightClickItemIndex == index }]"
      :aria-label="item.name" @click="handleToggleList(item.id)" @contextmenu="handleRigthClick($event, index)"
    >
      <material-music-cover size="lg" :name="item.name" />
      <span :class="$style.name">{{ item.name }}</span>
    </li>
  </ul>
  <base-menu
    v-model="isShowMenu"
    :menus="menus"
    :xy="menuLocation"
    item-name="name"
    @menu-click="handleMenuClick"
  />
</template>

<script setup>
import { watch, shallowReactive, ref } from '@common/utils/vueTools'
import { getBoardsList, setBoard } from '@renderer/store/leaderboard/action'
import { boards } from '@renderer/store/leaderboard/state'
import useMenu from './useMenu'
import { useRouter, useRoute } from '@common/utils/vueRouter'

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

const emit = defineEmits(['show-menu'])

const router = useRouter()
const route = useRoute()

const list = shallowReactive([])
const rightClickItemIndex = ref(-1)

const handleToggleList = (id) => {
  void router.replace({
    path: route.path,
    query: {
      source: props.source,
      boardId: id,
    },
  })
}

const {
  menus,
  menuLocation,
  isShowMenu,
  showMenu,
  menuClick,
} = useMenu({ emit, list })

const handleRigthClick = (event, index) => {
  rightClickItemIndex.value = index
  showMenu(event, index)
}
const handleMenuClick = (action) => {
  if (rightClickItemIndex.value < 0) return
  let index = rightClickItemIndex.value
  rightClickItemIndex.value = -1
  menuClick(action, index, props.source)
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

.listsContent {
  flex: auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  &:global(.scroll) {
    overflow-x: hidden;
    overflow-y: auto;
  }
}
.clicked {
  background-color: var(--color-well);
}
.name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  .mixin-ellipsis-1();
}


</style>

