<template>
  <div :class="$style.container">
    <div :class="$style.header">
      <base-tab :model-value="source" :list="sources" @change="handleSourceChange" />
      <base-tab :model-value="searchType" :list="searchTypes" @change="handleTypeChange" />
    </div>
    <div :class="$style.main">
      <song-list-list v-if="searchType == 'songlist'" v-show="searchText" :page="page" :source-id="source" />
      <catalog-list v-else-if="searchType == 'artist' || searchType == 'album'" v-show="searchText" :key="searchType" :kind="searchType" :page="page" :source-id="source" />
      <music-list v-else v-show="searchText" :page="page" :source-id="source" />
      <blank-view :visible="!searchText" :source="source" />
    </div>
  </div>
</template>

<script>
import { useRoute, useRouter } from '@common/utils/vueRouter'
import { searchText } from '@renderer/store/search/state'
import { getSearchSetting, setSearchSetting } from '@renderer/utils/data'
import { sources as _musicSources } from '@renderer/store/search/music'
import { sources as _songlistSources } from '@renderer/store/search/songlist'
import { getCatalogSearchSources } from '@renderer/store/search/catalog'

import MusicList from './MusicList/index.vue'
import SongListList from './SongListList/index.vue'
import CatalogList from './CatalogList/index.vue'
import BlankView from './components/BlankView.vue'
import { computed, ref } from '@common/utils/vueTools'
import { sourceNames } from '@renderer/store'

const VALID_SEARCH_TYPES = new Set(['music', 'artist', 'album', 'songlist'])
const source = ref('kw')
const searchType = ref(null)
const page = ref(1)

const firstQuery = (val) => (Array.isArray(val) ? val[0] : val)
const parsePositivePage = (val) => {
  const raw = firstQuery(val)
  if (raw == null || raw === '') return null
  const str = String(raw).trim()
  if (!/^[1-9]\d*$/.test(str)) return null
  const num = Number(str)
  return Number.isSafeInteger(num) ? num : null
}
const getSourcesForType = (type) => {
  if (type === 'artist' || type === 'album') return getCatalogSearchSources(type)
  if (type === 'songlist') return _songlistSources
  return _musicSources
}

const verifyQueryParams = async(to, from, next) => {
  let _source = firstQuery(to.query.source)
  let _type = firstQuery(to.query.type)
  const hasRawPage = Object.prototype.hasOwnProperty.call(to.query, 'page')
  const rawPage = firstQuery(to.query.page)
  const parsedPage = parsePositivePage(rawPage)
  const hasRawText = Object.prototype.hasOwnProperty.call(to.query, 'text')
  const rawText = firstQuery(to.query.text)

  const hasValidType = VALID_SEARCH_TYPES.has(_type)
  const validSourcesForType = hasValidType ? getSourcesForType(_type) : []
  const hasValidSource = hasValidType && typeof _source === 'string' && validSourcesForType.includes(_source)
  const hasInvalidPage = hasRawPage && parsedPage == null

  if (!hasValidType || !hasValidSource || hasInvalidPage) {
    const setting = await getSearchSetting()
    _type = hasValidType ? _type : (VALID_SEARCH_TYPES.has(setting.type) ? setting.type : 'music')
    const allowedSources = getSourcesForType(_type)
    if (typeof _source !== 'string' || !allowedSources.includes(_source)) {
      _source = allowedSources.includes(setting.source) ? setting.source : (allowedSources[0] ?? 'all')
    }
    const nextQuery = { ...to.query, source: _source, type: _type }
    if (parsedPage != null) nextQuery.page = parsedPage
    else if (hasInvalidPage) nextQuery.page = 1

    next({
      path: to.path,
      query: nextQuery,
    })
    return
  }
  source.value = _source
  searchType.value = _type

  if (parsedPage != null) page.value = parsedPage

  if (hasRawText) {
    searchText.value = rawText == null ? '' : String(rawText)
    if (parsedPage == null) page.value = 1
  }
  next()
  void setSearchSetting({ source: _source, type: _type })
}

export default {
  components: {
    MusicList,
    SongListList,
    CatalogList,
    BlankView,
  },
  beforeRouteEnter: verifyQueryParams,
  beforeRouteUpdate: verifyQueryParams,
  setup() {
    const route = useRoute()
    const router = useRouter()

    const sources = computed(() => getSourcesForType(searchType.value).map(id => {
      return {
        id,
        label: sourceNames.value[id],
      }
    }))
    const handleSourceChange = (id) => {
      void router.replace({
        path: route.path,
        query: {
          ...route.query,
          source: id,
          page: 1,
        },
      })
    }

    const searchTypes = computed(() => {
      return [
        { label: window.i18n.t('search__type_music'), id: 'music' },
        { label: window.i18n.t('search__type_artist'), id: 'artist' },
        { label: window.i18n.t('search__type_album'), id: 'album' },
        { label: window.i18n.t('search__type_songlist'), id: 'songlist' },
      ]
    })
    const handleTypeChange = (type) => {
      void router.replace({
        path: route.path,
        query: {
          ...route.query,
          type,
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
