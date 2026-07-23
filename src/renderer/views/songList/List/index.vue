<template>
  <div :class="$style.container">
    <div :class="$style.header">
      <svg :class="$style.headerIcon" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" aria-hidden="true" aria-label="歌单" space="preserve">
        <use xlink:href="#icon-album" />
      </svg>
      <div :class="$style.headerText">
        <div :class="$style.headerTitle">歌单</div>
        <div :class="$style.headerDesc">发现并管理各平台热门歌单</div>
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
      <tag-list :source="source" :tag-id="tagId" :sort-id="sortId" />
      <sort-tab :source="source" :tag-id="tagId" :sort-id="sortId" />
      <list-view :source="source" :tag-id="tagId" :sort-id="sortId" :page="page" />
    </div>
    <open-list-modal v-model="visibleOpenSongListModal" :source-list="sourceList" />
  </div>
</template>

<script lang="ts">
import { computed, ref } from '@common/utils/vueTools'
import { getSongListSetting, setSongListSetting } from '@renderer/utils/data'
import TagList from './components/TagList.vue'
import SortTab from './components/SortTab.vue'
import OpenListModal from './components/OpenListModal.vue'
import ListView from './ListView.vue'
import { sources, listInfo, isVisibleListDetail } from '@renderer/store/songList/state'
import { sourceNames } from '@renderer/store'
import { useRoute, useRouter } from '@common/utils/vueRouter'

const source = ref<LX.OnlineSource>('kw')
const tagId = ref<string>('')
const sortId = ref<string>('')
const page = ref<number>(1)


interface Query {
  source?: string
  tagId?: string
  sortId?: string
  page?: string
}

const verifyQueryParams = async function(this: any, to: { query: Query, path: string }, from: any, next: (route?: { path: string, query: Query }) => void) {
  let _source = to.query.source
  let _tagId = to.query.tagId
  let _sortId = to.query.sortId
  let _page: string | undefined = to.query.page

  if (isVisibleListDetail.value) {
    next({ path: '/songList/detail', query: {} })
    return
  } else if (_source == null) {
    if (listInfo.key) {
      _source = listInfo.source
      _tagId = listInfo.tagId
      _sortId = listInfo.sortId
      _page = listInfo.page.toString()
    } else {
      const setting = await getSongListSetting()
      _source = setting.source
      _tagId = setting.tagId
      _sortId = setting.sortId
      _page = '1'
    }

    next({
      path: to.path,
      query: { ...to.query, source: _source, tagId: _tagId, sortId: _sortId, page: _page },
    })
    return
  }
  next()
  source.value = _source as LX.OnlineSource
  tagId.value = _tagId ?? ''
  sortId.value = _sortId ?? ''
  page.value = _page ? parseInt(_page) : 1
  void setSongListSetting({ source: _source, tagId: _tagId, sortId: _sortId })
}


export default {
  components: {
    TagList,
    SortTab,
    ListView,
    OpenListModal,
  },
  beforeRouteEnter: verifyQueryParams,
  beforeRouteUpdate: verifyQueryParams,
  setup() {
    const visibleOpenSongListModal = ref(false)

    const sourceList = computed(() => {
      return sources.map(s => ({ id: s, name: sourceNames.value[s] }))
    })
    const router = useRouter()
    const route = useRoute()
    const handleToggleSource = (id: LX.OnlineSource) => {
      if (id == source.value) return
      void router.replace({
        path: route.path,
        query: {
          source: id,
          tagId: '',
        },
      })
    }

    return {
      source,
      tagId,
      sortId,
      page,
      sourceList,
      handleToggleSource,
      visibleOpenSongListModal,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  margin-top: -16px;
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
  &::-webkit-scrollbar-thumb {
    background-color: var(--color-primary-alpha-500);
    border-radius: 3px;
  }
}
.header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px 5px;
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
.sourceRow {
  flex: 0 0 auto;
  display: flex;
  flex-flow: row nowrap;
  padding: 8px 20px 0 20px;
  gap: 8px;
  overflow-x: auto;
}
.sourceOption {
  flex: none;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  color: var(--color-font-label);
  transition: color @transition-normal;
  &:hover {
    color: var(--color-primary-font-hover);
  }
}
.sourceOptionActive {
  color: var(--color-primary);
  font-weight: bold;
}
.toolbar {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  padding-bottom: 5px;
  padding-left: 20px;
  padding-right: 20px;
}
.left {
  flex: auto;
  display: flex;
  flex-flow: row nowrap;
}

.btn {
  color: var(--color-font);
  transition: color @transition-fast;
  background: none !important;
  &:hover {
    color: var(--color-primary-font-hover);
  }
}


.select {
  font-size: 12px;
  width: auto;
  flex: none;
  padding: 0 5px;

  &:hover {
    :global(.icon) {
      opacity: 1;
    }
  }


  :global {
    .label-content {
      background-color: transparent !important;
      transition: color @transition-fast;
      color: var(--color-font);
      // line-height: 38px;
      // height: 38px;
      border-radius: 0;
      &:hover {
        // background: none !important;
        color: var(--color-primary-font-hover);
        .icon {
          opacity: 1;
          // color: var(--color-primary-font-hover);
        }
      }
    }
    // .label {
    //   color: var(--color-font) !important;
    // }
    .icon {
      svg {
        width: .8em;
      }
      // opacity: .6;
      // transition: color @transition-fast;
      // color: var(--color-font-label);
    }

    .selection-list {
      max-height: 500px;
      box-shadow: 0 1px 4px 0 rgba(0,0,0,.2);
      li {
        // background-color: var(--color-main-background);
        text-align: center;
        line-height: 38px;
        font-size: 13px;
        &:hover {
          background-color: var(--color-button-background-hover);
        }
        &:active {
          background-color: var(--color-button-background-active);
        }
      }
    }
  }
}
</style>
