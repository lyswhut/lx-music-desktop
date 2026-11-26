<template>
  <ul ref="dom_lists_list" class="scroll" :class="$style.listsContent">
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
</template>

<script setup>
import { watch, shallowReactive, ref, onBeforeUnmount } from '@common/utils/vueTools'
import { clearListDetail, getBoardsList, setBoard, getCachedBoard } from '@renderer/store/leaderboard/action'
import { getLiveYtmContextKey } from '@renderer/utils/musicSdk/ytm/runtimeContext'
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


let boardLoadVersion = 0
let activeBoardReq = null
onBeforeUnmount(() => {
  boardLoadVersion++
  activeBoardReq?.cancel?.()
  activeBoardReq = null
})
watch(() => [props.source, props.source === 'ytm' ? getLiveYtmContextKey() : ''], async([source], _prev, onCleanup) => {
  const version = ++boardLoadVersion
  const originPath = route.path
  onCleanup(() => {
    if (boardLoadVersion === version) boardLoadVersion++
    activeBoardReq?.cancel?.()
    activeBoardReq = null
  })
  if (!source) {
    handleMenuClick()
    list.splice(0, list.length)
    return
  }
  const isSameSourceBoard = () => Boolean(props.boardId?.startsWith(`${source}__`))
  let boardList = getCachedBoard(source)
  if (boardList == null) {
    // 切换来源且未命中缓存时先清空旧侧栏并关闭右键菜单，防止异步加载窗口内误点/误藏旧国内榜单
    handleMenuClick()
    list.splice(0, list.length)
    if (!isSameSourceBoard()) {
      clearListDetail(window.i18n.t('list__loading'))
    }
    const contextKey = source === 'ytm' ? getLiveYtmContextKey() : undefined
    try {
      const req = getBoardsList(source)
      activeBoardReq = req
      const fetched = await req
      if (activeBoardReq === req) activeBoardReq = null
      if (version !== boardLoadVersion) return
      // 代理上下文在途漂移时直接丢弃旧响应，不缓存、不渲染也不触发自动跳转
      if (source === 'ytm' && contextKey !== getLiveYtmContextKey()) return
      if (!fetched) {
        handleMenuClick()
        list.splice(0, list.length)
        if (!isSameSourceBoard()) {
          clearListDetail(window.i18n.t('list__load_failed'))
        }
        return
      }
      if (!fetched.partial) {
        setBoard(fetched, source, contextKey)
      }
      boardList = fetched
    } catch (error) {
      if (version === boardLoadVersion) {
        handleMenuClick()
        list.splice(0, list.length)
        if (!isSameSourceBoard()) {
          clearListDetail(window.i18n.t('list__load_failed'))
        }
      }
      console.log(error)
      return
    }
  }
  if (version !== boardLoadVersion) return
  handleMenuClick()
  list.splice(0, list.length, ...boardList.list)
  const sameSourceBoardNow = isSameSourceBoard()
  const hasCurrentBoard = Boolean(sameSourceBoardNow && boardList.list.some(item => item.id == props.boardId))
  if (props.source === source && route.path === originPath) {
    if ((!sameSourceBoardNow || (!boardList.partial && !hasCurrentBoard)) && boardList.list.length) {
      handleToggleList(boardList.list[0].id)
    } else if (!sameSourceBoardNow && !boardList.list.length) {
      clearListDetail(window.i18n.t('no_item'))
    }
  }
}, {
  immediate: true,
})

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


</style>

