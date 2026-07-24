<template>
  <div :class="$style.boardListWrap">
    <ul ref="dom_lists_list" class="scroll" :class="$style.listsContent" @scroll="handleScroll">
      <li
        v-for="(item, index) in list"
        :key="item.id" :class="[$style.listsItem, { [$style.active]: item.id == boardId }, { [$style.clicked]: rightClickItemIndex == index }]"
        :aria-label="item.name" @click="handleToggleList(item.id)" @contextmenu="handleRigthClick($event, index)"
      >
        <span :class="$style.listsLabel">
          <transition name="list-active">
            <svg-icon v-if="item.id == boardId" name="angle-right-solid" :class="$style.activeIcon" />
          </transition>
          {{ item.name }}
        </span>
      </li>
    </ul>
    <base-menu
      v-model="isShowMenu"
      :menus="menus"
      :xy="menuLocation"
      item-name="name"
      @menu-click="handleMenuClick"
    />
    <div v-if="showScrollTopBtn" :class="$style.scrollTopBtn" @click="scrollToTop">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </div>
  </div>
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
const dom_lists_list = ref(null)

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

const showScrollTopBtn = ref(false)
const scrollToTop = () => {
  if (dom_lists_list.value) {
    dom_lists_list.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
const handleScroll = () => {
  if (dom_lists_list.value) {
    showScrollTopBtn.value = dom_lists_list.value.scrollTop > 100
  }
}

defineExpose({ hideMenu: handleMenuClick })

</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.listsContent {
  flex: auto;
  min-width: 0;
  overflow-y: scroll;
  // overflow-y: scroll !important;
  // border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.listsItem {
  position: relative;
  transition: .3s ease;
  transition-property: color, background-color;
  background-color: transparent;
  &:hover:not(.active) {
    background-color: var(--color-primary-background-hover);
    cursor: pointer;
  }
  &.active {
    // background-color:
    color: var(--color-primary);
  }
  &.selected {
    background-color: var(--color-primary-font-active);
  }
  &.clicked {
    background-color: var(--color-primary-background-hover);
  }
  &.editing {
    padding: 0 10px;
    background-color: var(--color-primary-background-hover);
    .listsLabel {
      display: none;
    }
    .listsInput {
      display: block;
    }
  }
}
.activeIcon {
  height: .9em;
  width: .9em;
  margin-left: -0.45em;
  vertical-align: -0.05em;
}
.listsLabel {
  display: block;
  height: 100%;
  padding: 0 10px;
  font-size: 13px;
  line-height: 36px;
  .mixin-ellipsis-1();
}

.boardListWrap {
  position: relative;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
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
