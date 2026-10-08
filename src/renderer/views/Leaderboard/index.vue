<template>
  <div :class="$style.leaderboard">
    <div :class="$style.pageHeader">
      <div :class="$style.pageIcon">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="-12 0 448 448" width="34" height="34" space="preserve">
          <use xlink:href="#icon-leaderboard" />
        </svg>
      </div>
      <div :class="$style.pageInfo">
        <h1 :class="$style.pageTitle">排行榜</h1>
        <p :class="$style.pageDesc">查看各大音乐平台排行榜</p>
      </div>
    </div>
    <div :class="$style.header">
      <div :class="$style.sourceTabs">
        <base-tab :model-value="source" :list="sourceList" item-key="id" item-label="name" @change="handleToggleSource" />
      </div>
      <BoardList ref="boardListRef" :board-id="boardId" :source="source" @show-menu="$refs.musicListRef?.hideMenu()" />
    </div>
    <div :class="$style.list">
      <MusicList ref="musicListRef" :source="source" :board-id="boardId" @show-menu="$refs.boardListRef?.hideMenu()" />
    </div>
    <common-back-to-top />
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
    BoardList,
    MusicList,
  },
  beforeRouteEnter: verifyQueryParams,
  beforeRouteUpdate: verifyQueryParams,
  setup() {
    const musicListRef = ref(null)
    const boardListRef = ref(null)
    const sourceList = computed(() => {
      return sources.map(s => ({ id: s, name: sourceNames.value[s] }))
    })
    const router = useRouter()
    const route = useRoute()
    const handleToggleSource = (id) => {
      void router.replace({
        path: route.path,
        query: {
          source: id,
        },
      })
    }

    return {
      source,
      boardId,
      sourceList,
      handleToggleSource,
      musicListRef,
      boardListRef,
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
}
.pageHeader {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: 30px 15px 14px;
}
.pageIcon {
  flex: none;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background-color: var(--color-primary-light-300-alpha-700);
  color: var(--color-primary);
  margin-right: 16px;
}
.pageInfo {
  flex: auto;
  min-width: 0;
}
.pageTitle {
  margin: 0;
  font-size: 24px;
  font-weight: normal;
  color: var(--color-font);
}
.pageDesc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-font-label);
}
.header {
  flex: none;
  width: 100%;
  display: flex;
  flex-flow: column nowrap;
  border-bottom: var(--color-list-header-border-bottom);
}
.sourceTabs {
  flex: none;
  width: 100%;
  :global(.list) {
    padding: 0 15px;
    gap: 20px;
  }
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
  height: 100%;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  // .noItem {

  // }
}

</style>
