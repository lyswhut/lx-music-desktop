<template>
  <div id="my-list" :class="$style.container">
    <header class="page-head" :class="$style.pageHead">
      <div>
        <h1>{{ listName }}</h1>
        <p>{{ $t('lists__list_hint') }}</p>
      </div>
      <div :class="$style.tools">
        <base-btn primary :disabled="!songCount" @click="playAll">
          <svg :class="$style.playIcon" viewBox="0 0 24 24" aria-hidden="true">
            <use xlink:href="#icon-line-play-fill" />
          </svg>
          {{ $t('lists__play_all') }}
        </base-btn>
        <base-btn outline @click="showSearch">{{ $t('lists__search_in') }}</base-btn>
        <span :class="$style.count">{{ $t('lists__song_count', { num: songCount }) }}</span>
      </div>
    </header>
    <div :class="$style.body">
      <MusicList v-if="listId" ref="musicList" hide-empty :list-id="listId" />
      <div v-if="!songCount" :class="$style.statePanel">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <use xlink:href="#icon-line-music" />
        </svg>
        <h2>{{ isLoveList ? $t('lists__empty_love') : $t('lists__empty_list') }}</h2>
        <p>{{ $t('lists__empty_desc') }}</p>
        <base-btn v-if="isLoveList" primary @click="goSearch">{{ $t('lists__empty_search') }}</base-btn>
        <base-btn v-else @click="addLocal">{{ $t('lists__select_local_file') }}</base-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { getListPrevSelectId } from '@renderer/utils/data'
import { defaultList, loveList, userLists, fetchingListStatus } from '@renderer/store/list/state'
import { getListMusics, getListMusicsFromCache } from '@renderer/store/list/action'
import { playList } from '@renderer/core/player'
import { addLocalFile } from './MyList/actions'

import MusicList from './MusicList/index.vue'

export default {
  name: 'List',
  components: {
    MusicList,
  },
  async beforeRouteEnter(to, from, next) {
    let id = to.query.id
    if (!id) {
      id = await getListPrevSelectId()
      next({
        path: to.path,
        query: { id },
      })
    } else next()
  },
  beforeRouteUpdate(to, from) {
    if (to.query.updated) return
    let id = to.query.id
    if (id == null) return
    this.listId = id
    const scrollIndex = to.query.scrollIndex
    const isAnimation = from.query.id == to.query.id
    this.$refs.musicList?.handleRestoreScroll?.(scrollIndex, isAnimation)

    return {
      path: '/list',
      query: { id, updated: true },
    }
  },
  beforeRouteLeave() {
    this.$refs.musicList?.saveListPosition?.()
  },
  data() {
    return {
      listId: '',
      songCount: 0,
    }
  },
  computed: {
    listName() {
      if (this.listId == loveList.id) return this.$t(loveList.name)
      if (this.listId == defaultList.id) return this.$t(defaultList.name)
      return userLists.find(l => l.id == this.listId)?.name ?? ''
    },
    isLoveList() {
      return this.listId == loveList.id
    },
    fetching() {
      return fetchingListStatus[this.listId]
    },
  },
  watch: {
    '$route.query.id'(id) {
      if (id) this.listId = id
    },
    listId: {
      immediate: true,
      handler(id) {
        void this.refreshCount(id)
      },
    },
    fetching() {
      void this.refreshCount(this.listId)
    },
  },
  created() {
    this.listId = this.$route.query.id
    this.songCount = getListMusicsFromCache(this.listId).length
  },
  methods: {
    playAll() {
      if (!this.listId || !this.songCount) return
      playList(this.listId, 0)
    },
    showSearch() {
      this.$refs.musicList?.showSearchBar?.()
    },
    goSearch() {
      void this.$router.push({ path: '/search' })
    },
    addLocal() {
      const info = this.listId == loveList.id
        ? loveList
        : this.listId == defaultList.id
          ? defaultList
          : userLists.find(l => l.id == this.listId)
      if (!info) return
      void (async() => {
        await addLocalFile(info)
        await this.refreshCount(this.listId)
      })()
    },
    async refreshCount(id) {
      if (!id) {
        this.songCount = 0
        return
      }
      const list = await getListMusics(id)
      if (this.listId == id) this.songCount = list.length
    },
    handleContainerClick() {},
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  padding: 29px 32px 0;
  box-sizing: border-box;
}

.pageHead {
  flex: none;
  min-width: 0;
  h1 {
    .mixin-ellipsis-1();
  }
}

.tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.playIcon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  fill: currentColor;
}

.count {
  font-size: 12px;
  color: var(--color-secondary, var(--color-font-label));
}

.body {
  position: relative;
  flex: auto;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
}

.statePanel {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  pointer-events: none;

  svg {
    width: 34px;
    height: 34px;
    color: var(--color-secondary, var(--color-font-label));
    fill: none;
    stroke: currentColor;
    margin-bottom: 4px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 650;
    line-height: 1.4;
  }
  p {
    margin: 0;
    max-width: 360px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--color-secondary, var(--color-font-label));
  }
  button {
    margin-top: 6px;
    pointer-events: auto;
  }
}

@media (max-width: 920px) {
  .container {
    padding: 12px 12px 0;
  }
  .pageHead h1 {
    font-size: 20px;
  }
  .count {
    display: none;
  }
}
</style>
