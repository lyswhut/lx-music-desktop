<template>
  <div id="my-list" :class="$style.container" @click="handleContainerClick">
    <div :class="$style.header">
      <svg :class="$style.headerIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 444.87 391.18" aria-hidden="true" aria-label="歌曲列表" space="preserve">
        <use xlink:href="#icon-love" />
      </svg>
      <div :class="$style.headerText">
        <div :class="$style.headerTitle">歌曲列表</div>
        <div :class="$style.headerBtns">
          <button :class="$style.headerBtn" :aria-label="$t('lists__new_list_btn')" @click="$refs.myList.isShowNewList = true">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 24 24" space="preserve">
              <use xlink:href="#icon-list-add" />
            </svg>
            <span :class="$style.headerBtnText">新建列表</span>
          </button>
          <button :class="$style.headerBtn" :aria-label="$t('list_update_modal__title')" @click="$refs.myList.isShowListUpdateModal = true">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" style="transform: rotate(45deg);" height="100%" viewBox="0 0 24 24" space="preserve">
              <use xlink:href="#icon-refresh" />
            </svg>
            <span :class="$style.headerBtnText">刷新歌单</span>
          </button>
          <button :class="$style.headerBtn" :aria-label="$t('songlist__import_input_show_btn')" @click="visibleOpenSongListModal = true">
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 247 247" space="preserve">
              <use xlink:href="#icon-musicFolder" />
            </svg>
            <span :class="$style.headerBtnText">打开歌单</span>
          </button>
        </div>
      </div>
    </div>
    <div :class="$style.content">
      <div :class="$style.topListBar">
        <MyList ref="myList" :list-id="listId" @show-menu="$refs.musicList.handleMenuClick()" />
      </div>
      <div :class="$style.musicListContainer">
        <MusicList ref="musicList" :list-id="listId" @show-menu="$refs.myList.handleMenuClick()" />
      </div>
    </div>
    <open-list-modal v-model="visibleOpenSongListModal" :source-list="sourceList" />
  </div>
</template>

<script>
import { getListPrevSelectId } from '@renderer/utils/data'

import MyList from './MyList/index.vue'
import MusicList from './MusicList/index.vue'
import OpenListModal from '../songList/List/components/OpenListModal.vue'

import { sources } from '@renderer/store/songList/state'
import { sourceNames } from '@renderer/store'

export default {
  name: 'List',
  components: {
    MyList,
    MusicList,
    OpenListModal,
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
    // console.log(to, from)
    if (to.query.updated) return
    let id = to.query.id
    if (id == null) return
    // if (!getList(id)) {
    //   id = defaultList.id
    // }
    this.listId = id
    const scrollIndex = to.query.scrollIndex
    const isAnimation = from.query.id == to.query.id
    this.$refs.musicList?.handleRestoreScroll(scrollIndex, isAnimation)

    return {
      path: '/list',
      query: { id, updated: true },
    }
  },
  beforeRouteLeave(to, from) {
    this.$refs.musicList?.saveListPosition()
  },
  data() {
    return {
      listId: null,
      visibleOpenSongListModal: false,
    }
  },
  computed: {
    sourceList() {
      return sources.map(s => ({ id: s, name: sourceNames.value[s] }))
    },
  },
  created() {
    this.listId = this.$route.query.id
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
  margin-top: -16px;
}

.header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
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
  gap: 4px;
}

.headerTitle {
  font-size: 28px;
  font-weight: normal;
  color: var(--color-font);
  line-height: 1.2;
}

.headerBtns {
  display: flex;
  gap: 6px;
  align-items: center;
}

.headerBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 8px;
  gap: 4px;
  color: var(--color-font-desc);
  background: rgba(150, 150, 150, 0.18);
  border: 1px solid rgba(150, 150, 150, 0.25);
  cursor: pointer;
  border-radius: 6px;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
  &:hover {
    color: var(--color-font);
    background-color: rgba(150, 150, 150, 0.35);
    border-color: rgba(150, 150, 150, 0.45);
  }
}

.headerBtnText {
  font-size: 12px;
  white-space: nowrap;
}

.content {
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  min-height: 0;
  overflow: hidden;
}

.topListBar {
  flex: 0 0 auto;
  width: 100%;
}

.musicListContainer {
  flex: auto;
  min-height: 0;
  overflow: hidden;
}

</style>
