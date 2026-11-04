<template>
  <div ref="rootRef" :class="$style.leaderboard">
    <div ref="topBarRef" :class="$style.topBar">
      <div :class="$style.pageHeader">
        <div :class="$style.pageIcon">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 425.22 425.2" height="32" width="32" space="preserve">
            <use xlink:href="#icon-leaderboard" />
          </svg>
        </div>
        <div :class="$style.pageInfo">
          <span :class="$style.pageTitle">{{ $t('leaderboard') }}</span>
          <span :class="$style.pageDesc">{{ $t('leaderboard__desc') }}</span>
        </div>
      </div>
      <div :class="$style.header">
        <div :class="$style.sourceWrap">
          <span :class="$style.subLabel">{{ $t('search__category') }}:</span>
          <div :class="$style.sourceTab">
            <button
              v-for="item in sourceList"
              :key="item.id"
              type="button"
              :class="[$style.sourceBtn, { [$style.sourceBtnActive]: source == item.id }]"
              @click="handleToggleSource(item.id)"
            >{{ item.name }}</button>
          </div>
        </div>
      </div>
    </div>
    <BoardList ref="boardListRef" :board-id="boardId" :source="source" @show-menu="$refs.musicListRef?.hideMenu()" @board-change="handleBoardChange" />
    <div ref="listRef" :class="$style.list">
      <MusicList ref="musicListRef" :source="source" :board-id="boardId" @show-menu="$refs.boardListRef?.hideMenu()" />
    </div>
  </div>
</template>

<script>
import { computed, ref } from '@common/utils/vueTools'
import { getLeaderboardSetting, setLeaderboardSetting } from '@renderer/utils/data'
import BoardList from './BoardList/index.vue'
import MusicList from './MusicList/index.vue'
import { sources } from '@renderer/store/leaderboard/state'
import { sourceNames } from '@renderer/store'
import { useRoute, useRouter } from '@common/utils/vueRouter'


const source = ref('')
const boardId = ref(null)

// 记住每个音源上次浏览的榜单，切回该音源时直接复用已加载的数据
const lastBoardIds = new Map()

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
  if (_boardId) lastBoardIds.set(_source, _boardId)
  void setLeaderboardSetting({ source: _source, boardId: _boardId })
}


export default {
  components: {
    BoardList,
    MusicList,
  },
  beforeRouteEnter: verifyQueryParams,
  beforeRouteUpdate: verifyQueryParams,
  setup() {
    const musicListRef = ref(null)
    const boardListRef = ref(null)
    const rootRef = ref(null)
    const topBarRef = ref(null)
    const listRef = ref(null)
    const sourceList = computed(() => {
      return sources.map(s => ({ id: s, name: sourceNames.value[s] }))
    })
    const router = useRouter()
    const route = useRoute()
    const handleToggleSource = (id) => {
      if (id == source.value) return
      void router.replace({
        path: route.path,
        query: {
          source: id,
          boardId: lastBoardIds.get(id),
        },
      })
    }

    const handleBoardChange = () => {
      const root = rootRef.value
      const listEl = listRef.value
      if (!root || !listEl) return
      const top = listEl.offsetTop - (topBarRef.value?.offsetHeight ?? 0)
      if (top <= root.scrollTop) return
      root.scrollTo({ top, behavior: 'smooth' })
    }

    return {
      source,
      boardId,
      sourceList,
      handleToggleSource,
      handleBoardChange,
      musicListRef,
      boardListRef,
      rootRef,
      topBarRef,
      listRef,
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
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}
// 标题与音源标签行整体吸顶，不随内容滚动
.topBar {
  position: sticky;
  top: 0;
  z-index: 10;
  flex: none;
  background-color: var(--color-content-background);
}
.pageHeader {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 12px;
  padding: 0 15px 15px;
}
.pageIcon {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background-color: var(--color-primary-light-300-alpha-700);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  svg {
    width: 36px;
    height: 36px;
    fill: currentColor;
  }
}
.pageInfo {
  display: flex;
  flex-flow: column nowrap;
  gap: 4px;
}
.pageTitle {
  font-size: 28px;
  font-weight: normal;
  color: var(--color-primary);
}
.pageDesc {
  font-size: 13px;
  color: var(--color-font-label);
}
.header {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: 5px 20px;
  background-color: var(--color-content-background);
  border-bottom: 1px solid var(--color-primary-light-400-alpha-300);
}
.sourceWrap {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
}
.subLabel {
  color: var(--color-font-label);
  font-size: 13px;
  flex: none;
  margin-right: 6px;
}
.sourceTab {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 4px;
}
.sourceBtn {
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-font);
  font-size: 13px;
  padding: 6px 12px;
  cursor: pointer;
  transition: color .2s ease, background-color .2s ease;
  border-radius: 4px;

  &:hover:not(.sourceBtnActive) {
    background-color: var(--color-button-background-hover);
  }
}
.sourceBtnActive {
  color: var(--color-primary);
  font-weight: 500;
  background-color: var(--color-primary-light-400-alpha-300);
}

.tab {
  flex: auto;
}
.select {
  flex: none;
  width: 80px;
}
.content {
  flex: auto;
  display: flex;
  overflow: hidden;
  flex-flow: column nowrap;
}

.list {
  position: relative;
  overflow: hidden;
  flex: none;
  height: 100%;
  min-height: 300px;
  display: flex;
  flex-flow: column nowrap;
}

</style>
