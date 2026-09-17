<template>
  <div :class="$style.container">
    <div class="page-head" :class="$style.pageHead">
      <div>
        <h1>{{ $t('songlist__title') }}</h1>
        <p>{{ $t('songlist__subtitle') }}</p>
      </div>
      <div :class="$style.pageTools">
        <base-btn outline @click="visibleOpenSongListModal = true">{{ $t('songlist__import_input_show_btn') }}</base-btn>
        <base-selection :model-value="source" chrome="source" :class="$style.select" :list="sourceList" item-key="id" item-name="name" @update:model-value="handleToggleSource" />
      </div>
    </div>
    <div :class="$style.header">
      <tag-list :source="source" :tag-id="tagId" :sort-id="sortId" />
      <sort-tab :source="source" :tag-id="tagId" :sort-id="sortId" />
    </div>
    <list-view :source="source" :tag-id="tagId" :sort-id="sortId" :page="page" />
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
import { sources, listInfo } from '@renderer/store/songList/state'
import { setVisibleListDetail } from '@renderer/store/songList/action'
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

  setVisibleListDetail(false)
  if (_source == null) {
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
  padding: 29px 32px 0;
  box-sizing: border-box;
}
.pageHead {
  flex: none;
}
.pageTools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.header {
  flex: none;
  position: relative;
  z-index: 12;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--color-line);
}
.left {
  flex: auto;
  display: flex;
  flex-flow: row nowrap;
}

.select {
  font-size: 12px;
  width: auto;
  flex: none;
  padding: 0;
}

</style>
