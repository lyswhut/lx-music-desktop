<template>
  <div :class="$style.container">
    <div :class="$style.header">
      <base-tab v-model="source" :list="sources" @change="handleSourceChange" />
      <base-tab v-model="searchType" :list="searchTypes" @change="handleTypeChange" />
    </div>
    <div :class="$style.main">
      <song-list-list v-if="searchType == 'songlist'" v-show="searchText" :page="page" :source-id="source" />
      <album-list v-else-if="searchType == 'album'" v-show="searchText" :page="page" :source-id="source" />
      <music-list v-else v-show="searchText" :page="page" :source-id="source" />
      <blank-view :visible="!searchText" :source="source" />
    </div>
  </div>
</template>

<script>
import { useRoute, useRouter } from '@common/utils/vueRouter'
import { searchText } from '@renderer/store/search/state'
import { getSearchSetting, setSearchSetting } from '@renderer/utils/data'
import { sources as _sources } from '@renderer/store/search/music'
import { sources as _songlistSources } from '@renderer/store/search/songlist'
import { sources as _albumSources } from '@renderer/store/search/album'

import MusicList from './MusicList/index.vue'
import SongListList from './SongListList/index.vue'
import AlbumList from './AlbumList/index.vue'
import BlankView from './components/BlankView.vue'
import { computed, ref } from '@common/utils/vueTools'
import { sourceNames } from '@renderer/store'

const source = ref('kw')
const searchType = ref(null)
const page = ref(1)

const getSupportList = (type) => type == 'songlist' ? _songlistSources : type == 'album' ? _albumSources : _sources

const verifyQueryParams = async(to, from, next) => {
  let _source = to.query.source
  let _type = to.query.type
  let _page = to.query.page

  if (_source == null || _type == null) {
    const setting = await getSearchSetting()
    _source ??= setting.source
    _type ??= setting.type

    next({
      path: to.path,
      query: { ...to.query, source: _source, type: _type, page: _page },
    })
    return
  }
  // 若当前源不支持该子页签类型，则自动回退到歌曲子页签
  if (!getSupportList(_type).includes(_source)) {
    _type = 'music'
    next({
      path: to.path,
      query: { ...to.query, source: _source, type: _type, page: _page },
    })
    return
  }
  source.value = _source
  searchType.value = _type

  if (_page) page.value = parseInt(_page)

  if (to.query.text != null) {
    searchText.value = to.query.text
    if (!_page) page.value = 1
  }
  next()
  void setSearchSetting({ source: _source, type: _type })
}

export default {
  components: {
    MusicList,
    SongListList,
    AlbumList,
    BlankView,
  },
  beforeRouteEnter: verifyQueryParams,
  beforeRouteUpdate: verifyQueryParams,
  setup() {
    const route = useRoute()
    const router = useRouter()

    const sources = computed(() => {
      return _sources.map(id => {
        return {
          id,
          label: sourceNames.value[id],
        }
      })
    })
    const handleSourceChange = (id) => {
      // 若当前源不支持当前子页签类型，则自动回退到歌曲子页签
      const type = getSupportList(searchType.value).includes(id) ? searchType.value : 'music'
      void router.replace({
        path: route.path,
        query: {
          ...route.query,
          source: id,
          type,
          page: 1,
        },
      })
    }

    const searchTypes = computed(() => {
      const list = [
        { label: window.i18n.t('search__type_music'), id: 'music' },
        { label: window.i18n.t('search__type_songlist'), id: 'songlist' },
        { label: window.i18n.t('search__type_album'), id: 'album' },
      ]
      // mg 源不支持专辑搜索，处于 mg 页签时隐藏专辑子页签
      return source.value == 'mg' ? list.filter(item => item.id != 'album') : list
    })
    const handleTypeChange = (type) => {
      const list = getSupportList(type)
      const _source = list.includes(source.value) ? source.value : list[0]
      void router.replace({
        path: route.path,
        query: {
          ...route.query,
          type,
          source: _source,
          page: 1,
        },
      })
    }


    return {
      sources,
      source,
      handleSourceChange,
      searchTypes,
      searchType,
      handleTypeChange,
      page,
      searchText,
    }
  },
}


</script>

<style lang="less" module>
.container {
  display: flex;
  flex-flow: column nowrap;
}

.header {
  // padding: 5px 0;
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}

.main {
  position: relative;
  flex: auto;
  // min-height: 0;
}
</style>
