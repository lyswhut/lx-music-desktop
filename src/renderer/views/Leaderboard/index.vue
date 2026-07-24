<template>
  <div :class="$style.leaderboard">
    <div :class="$style.header">
      <svg :class="$style.headerIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" aria-hidden="true" aria-label="排行榜" space="preserve">
        <use xlink:href="#icon-leaderboard" />
      </svg>
      <div :class="$style.headerText">
        <div :class="$style.headerTitle">排行榜</div>
        <div :class="$style.headerDesc">查看各平台热门歌曲榜单</div>
      </div>
    </div>
    <div :class="$style.content">
      <div :class="$style.sourceRow">
        <div
          v-for="item in sourceList"
          :key="item.id"
          :class="[$style.sourceOption, { [$style.sourceOptionActive]: source === item.id }]"
          @click="handleToggleSource(item.id)"
        >{{ item.name }}</div>
      </div>
      <div ref="dom_board_row" :class="$style.boardRow">
        <div
          v-for="(item, index) in boardList"
          :key="item.id"
          :class="[$style.boardOption, { [$style.boardOptionActive]: item.id == boardId }]"
          @click="handleToggleBoard(item.id)"
          @contextmenu="handleBoardRightClick($event, index)"
        >{{ item.name }}</div>
      </div>
      <div :class="$style.contentRow">
        <div :class="$style.list">
          <MusicList ref="musicListRef" :source="source" :board-id="boardId" @show-menu="hideMenu" />
        </div>
      </div>
      <base-menu
        v-model="isShowMenu"
        :menus="menus"
        :xy="menuLocation"
        item-name="name"
        @menu-click="handleMenuClick"
      />
    </div>
  </div>
</template>

<script>
import { computed, ref, shallowReactive, watch, nextTick } from '@common/utils/vueTools'
import { getLeaderboardSetting, setLeaderboardSetting } from '@renderer/utils/data'
import MusicList from './MusicList/index.vue'
import { sources, boards } from '@renderer/store/leaderboard/state'
import { sourceNames } from '@renderer/store'
import { getBoardsList, setBoard } from '@renderer/store/leaderboard/action'
import { useRoute, useRouter } from '@common/utils/vueRouter'
import { useI18n } from '@renderer/plugins/i18n'
import { addSongListDetail, playSongListDetail } from './action'


const source = ref('')
const boardId = ref(null)
const boardList = shallowReactive([])
const rightClickItemIndex = ref(-1)
const menuLocation = shallowReactive({ x: 0, y: 0 })
const isShowMenu = ref(false)

const verifyQueryParams = async function(to, from, next) {
  let _source = to.query.source
  let _boardId = to.query.boardId

  if (_source == null) {
    const setting = await getLeaderboardSetting()
    if (_source == null) {
      _source = setting.source
      _boardId = setting.boardId
    }
    next({
      path: to.path,
      query: { ...to.query, source: _source, boardId: _boardId },
    })
    return
  }
  next()
  source.value = _source
  boardId.value = _boardId
  void setLeaderboardSetting({ source: _source, boardId: _boardId })
}


export default {
  components: {
    MusicList,
  },
  beforeRouteEnter: verifyQueryParams,
  beforeRouteUpdate: verifyQueryParams,
  setup() {
    const musicListRef = ref(null)
    const t = useI18n()
    const sourceList = computed(() => {
      return sources.map(s => ({ id: s, name: sourceNames.value[s] }))
    })
    const router = useRouter()
    const route = useRoute()

    const menus = computed(() => {
      return [
        { name: t('list__play'), action: 'play', disabled: false },
        { name: t('list__collect'), action: 'collect', disabled: false },
      ]
    })

    const handleToggleSource = (id) => {
      void router.replace({
        path: route.path,
        query: {
          source: id,
        },
      })
    }

    const handleToggleBoard = (id) => {
      void router.replace({
        path: route.path,
        query: {
          source: source.value,
          boardId: id,
        },
      })
    }

    const handleBoardRightClick = (event, index) => {
      rightClickItemIndex.value = index
      menuLocation.x = event.pageX
      menuLocation.y = event.pageY
      if (isShowMenu.value) return
      void nextTick(() => {
        isShowMenu.value = true
      })
    }

    const hideMenu = () => {
      isShowMenu.value = false
    }

    const handleMenuClick = (action) => {
      if (rightClickItemIndex.value < 0) return
      const index = rightClickItemIndex.value
      rightClickItemIndex.value = -1
      isShowMenu.value = false
      if (!action) return
      const board = boardList[index]
      switch (action.action) {
        case 'play':
          void playSongListDetail(board.id)
          break
        case 'collect':
          void addSongListDetail(board.id, board.name, source.value)
          break
      }
    }

    watch(source, async(s) => {
      let board = boards[s]
      if (board == null) setBoard(board = await getBoardsList(s), s)
      boardList.splice(0, boardList.length, ...board.list)
      if (!boardId.value && board.list.length) handleToggleBoard(board.list[0].id)
    }, { immediate: true })

    return {
      source,
      boardId,
      sourceList,
      boardList,
      handleToggleSource,
      handleToggleBoard,
      handleBoardRightClick,
      menus,
      menuLocation,
      isShowMenu,
      hideMenu,
      handleMenuClick,
      musicListRef,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.leaderboard {
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  margin-top: -16px;
}
.header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  margin-bottom: 5px;
}
.headerIcon {
  width: 40px;
  height: 40px;
  padding: 22px;
  color: var(--color-primary);
  background-color: var(--color-primary-light-400-alpha-700);
  border-radius: 12px;
  flex: 0 0 auto;
}
.headerText {
  display: flex;
  flex-flow: column nowrap;
  margin-top: -8px;
}
.headerTitle {
  font-size: 28px;
  font-weight: normal;
  color: var(--color-font);
  line-height: 1.2;
}
.headerDesc {
  font-size: 12px;
  color: var(--color-font-desc);
  opacity: 0.7;
  margin-top: 20px;
}
.content {
  flex: auto;
  display: flex;
  overflow-y: auto;
  overflow-x: hidden;
  flex-flow: column nowrap;
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
    background-color: rgba(0, 0, 0, 0);
  }
  &::-webkit-scrollbar-track {
    background-color: var(--color-primary-light-100-alpha-800);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background-color: var(--color-primary-alpha-600);
    transition: background-color 0.4s ease;
  }
  &::-webkit-scrollbar-thumb:hover {
    border-radius: 3px;
    background-color: var(--color-primary-alpha-400);
    transition: background-color 0.4s ease;
  }
}
.sourceRow {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  gap: 2px;
  padding: 10px 20px;
  border-bottom: var(--color-list-header-border-bottom);
}
.sourceOption {
  line-height: 1;
  white-space: nowrap;
  font-size: 13px;
  color: var(--color-font);
  padding: 4px 10px;
  margin: 0;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  &:hover {
    color: var(--color-primary);
  }
}
.sourceOptionActive {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  &:hover {
    color: var(--color-primary);
  }
}
.boardRow {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-flow: row wrap;
  gap: 6px;
  padding: 8px 20px;
}
.boardOption {
  padding: 5px 10px;
  background-color: transparent;
  border-radius: 14px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease, color 0.2s ease;
  color: var(--color-font-desc);
  border: 1px solid var(--color-button-background);
  &:hover {
    background-color: var(--color-button-background-hover);
    color: var(--color-font);
  }
}
.boardOptionActive {
  background-color: var(--color-primary);
  color: #ffffff;
  border-color: var(--color-primary);
  &:hover {
    background-color: var(--color-primary-light-300);
    border-color: var(--color-primary-light-300);
  }
}
.contentRow {
  display: flex;
  width: 100%;
}
.list {
  position: relative;
  width: 100%;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
}
</style>
