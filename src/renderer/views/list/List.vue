<template>
<div id="my-list" :class="$style.container" @click="handleContainerClick" v-if="isInitedList">
  <MyLists :list-id="listId" @show-menu="$refs.musicList.handleMenuClick()" ref="lists" />
  <MusicList :list-id="listId" @show-menu="$refs.lists.hideListsMenu()" ref="musicList" />
</div>

</template>

<script>
import { getListPrevSelectId } from '@renderer/utils/data'
import { isInitedList, defaultList } from '@renderer/core/share/list'
import { getList } from '@renderer/core/share/utils'

import MyLists from './components/MyLists'
import MusicList from './components/MusicList'

export default {
  name: 'List',
  components: {
    MyLists,
    MusicList,
  },
  setup() {
    return {
      isInitedList,
    }
  },
  data() {
    return {
      listId: null,
      focusTarget: 'listDetail',
    }
  },
  beforeRouteEnter(to, from) {
    let id = to.query.id
    if (!id) {
      id = getListPrevSelectId() || defaultList.id
      return {
        path: '/list',
        query: { id },
      }
    }
  },
  beforeRouteUpdate(to, from) {
    // console.log(to, from)
    if (to.query.updated) return
    let id = to.query.id
    if (id == null || !getList(id)) {
      id = defaultList.id
    }
    this.listId = id
    const scrollIndex = to.query.scrollIndex
    const isAnimation = from.query.id == to.query.id
    this.$nextTick(() => {
      this.$refs.musicList.restoreScroll(scrollIndex, isAnimation)
    })
    return {
      path: '/list',
      query: { id, updated: true },
    }
  },
  beforeRouteLeave(to, from) {
    this.$refs.musicList.saveListPosition()
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
  position: relative;
}

@lists-item-height: 36px;
.lists {
  flex: none;
  width: 16%;
  display: flex;
  flex-flow: column nowrap;
}
.listHeader {
  position: relative;
  &:hover {
    .listsAdd {
      opacity: 1;
    }
  }
}
.listsTitle {
  font-size: 12px;
  line-height: 38px;
  padding: 0 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  flex: none;
}
.listsAdd {
  position: absolute;
  right: 0;
  top: 8px;
  background: none;
  height: 30px;
  border: none;
  outline: none;
  border-radius: @radius-border;
  cursor: pointer;
  opacity: 0;
  transition: opacity @transition-theme;
  color: @color-btn;
  svg {
    vertical-align: bottom;
  }
  &:active {
    opacity: .7 !important;
  }
}
.listsContent {
  flex: auto;
  min-width: 0;
  overflow-y: scroll;
  overflow-x: hidden;
  // border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.listsItem {
  position: relative;
  transition: .3s ease;
  transition-property: color, background-color, opacity;
  background-color: transparent;
  &:hover:not(.active) {
    background-color: @color-theme_2-hover;
    cursor: pointer;
  }
  &.active {
    // background-color:
    color: @color-theme;
  }
  &.selected {
    background-color: @color-theme_2-active;
  }
  &.clicked {
    background-color: @color-theme_2-hover;
  }
  &.fetching {
    opacity: .5;
  }
  &.editing {
    padding: 0 10px;
    background-color: @color-theme_2-hover;
    .listsLabel {
      display: none;
    }
    .listsInput {
      display: block;
    }
  }
}
.listsLabel {
  display: block;
  height: @lists-item-height;
  padding: 0 10px;
  font-size: 13px;
  line-height: @lists-item-height;
  .mixin-ellipsis-1;
}
.listsInput {
  width: 100%;
  height: @lists-item-height;
  border: none;
  padding: 0;
  // padding-bottom: 1px;
  line-height: @lists-item-height;
  background: none;
  outline: none;
  font-size: 13px;
  display: none;
  font-family: inherit;
}

.listsNew {
  padding: 0 10px;
  background-color: @color-theme_2-hover;
  .listsInput {
    display: block;
  }
}
.newLeave {
  margin-top: -@lists-item-height;
  z-index: -1;
}

.list {
  overflow: hidden;
  height: 100%;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  // .noItem {

  // }
}
.content {
  min-height: 0;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
  // table {
  //   position: relative;
  //   thead {
  //     position: fixed;
  //     width: 100%;
  //     th {
  //       width: 100%;
  //     }
  //   }
  // }
  &.copying {
    .no-select {
      display: none;
    }
  }
}
.thead {
  flex: none;
  tr > th:first-child {
    color: @color-theme_2-font-label;
    // padding-left: 10px;
  }
}
:global(.list) {
  flex: auto;
  :global(.list-item) {
    &.active {
      color: @color-btn;
    }
  }
  :global(.list-item-cell) {
    font-size: 12px !important;

    &:first-child {
      // padding-left: 10px;
      font-size: 11px !important;
      color: @color-theme_2-font-label !important;
    }
  }
}

.labelSource {
  color: @color-theme;
  padding: 5px;
  font-size: .8em;
  line-height: 1;
  opacity: .75;
  display: inline-block;
}

.disabled {
  opacity: .5;
}

.no-item {
  position: relative;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  p {
    font-size: 24px;
    color: @color-theme_2-font-label;
  }
}

each(@themes, {
  :global(#root.@{value}) {
    .listsAdd {
      color: ~'@{color-@{value}-btn}';
    }
    .listsItem {
      &:hover:not(.active) {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &.active {
        color: ~'@{color-@{value}-theme}';
      }
      &.select {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
      &.clicked {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &.editing {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
    }
    .listsNew {
      background-color: ~'@{color-@{value}-theme_2-hover}';
    }
    :global(.list) {
      :global(.list-item) {
        &.active {
          color: ~'@{color-@{value}-btn}';
        }
      }
      :global(.list-item-cell) {
        &:first-child {
          color: ~'@{color-@{value}-theme_2-font-label}' !important;
        }
      }
    }
    .labelSource {
      color: ~'@{color-@{value}-theme}';
    }
    .no-item {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
  }
})

</style>
