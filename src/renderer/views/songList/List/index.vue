<template>
  <div :class="$style.container">
    <div :class="$style.pageHeader">
      <div :class="$style.pageIcon">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 425.2 425.2" height="32" width="32" space="preserve">
          <use xlink:href="#icon-album" />
        </svg>
      </div>
      <div :class="$style.pageInfo">
        <span :class="$style.pageTitle">{{ $t('song_list') }}</span>
        <span :class="$style.pageDesc">{{ $t('song_list__desc') }}</span>
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
    <div :class="$style.tagBar">
      <tag-list :source="source" :tag-id="tagId" :sort-id="sortId" />
      <sort-tab :source="source" :tag-id="tagId" :sort-id="sortId" />
    </div>
    <list-view :source="source" :tag-id="tagId" :sort-id="sortId" :page="page" />
  </div>
</template>

<script lang="ts">
import { computed, ref } from '@common/utils/vueTools'
import { getSongListSetting, setSongListSetting } from '@renderer/utils/data'
import TagList from './components/TagList.vue'
import SortTab from './components/SortTab.vue'
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
  },
  beforeRouteEnter: verifyQueryParams,
  beforeRouteUpdate: verifyQueryParams,
  setup() {
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
  padding: 5px 10px;
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
.tagBar {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  align-items: flex-start;
  padding: 5px 10px;
  gap: 10px;
}

.btn {
  flex: none;
  color: var(--color-font);
  transition: color @transition-fast;
  background: none !important;
  margin-top: 8px;
  &:hover {
    color: var(--color-primary-font-hover);
  }
}

</style>
