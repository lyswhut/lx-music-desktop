<template>
  <div :class="[$style.container, { [$style.landing]: !searchText }]">
    <div class="page-head" :class="$style.pageHead">
      <div>
        <h1>{{ pageTitle }}</h1>
        <p v-if="searchText" class="truncate" :title="searchText">{{ $t('search__result_meta', { query: searchText, num: resultCount }) }}</p>
        <p v-else>{{ $t('search__subtitle') }}</p>
      </div>
      <base-selection
        :model-value="source"
        chrome="source"
        :class="$style.sourceSelect"
        :list="sourceSelectList"
        item-key="id"
        item-name="label"
        @update:model-value="handleSourceChange"
      />
    </div>
    <form class="search-big" @submit.prevent="submitLanding">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <use xlink:href="#icon-line-search" />
      </svg>
      <input v-model.trim="landingQuery" :placeholder="$t('search__input_short')" :aria-label="$t('search')" autocomplete="off">
      <button v-if="landingQuery" type="button" :class="$style.clearBtn" :aria-label="$t('btn_close')" @click="clearLanding">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <use xlink:href="#icon-line-close" />
        </svg>
      </button>
      <kbd v-else>↵</kbd>
    </form>
    <div v-if="searchText" :class="$style.header">
      <div class="seg">
        <button
          v-for="item in searchTypes"
          :key="item.id"
          type="button"
          :class="{ active: searchType == item.id }"
          @click="handleTypeChange(item.id)"
        >{{ item.label }}</button>
      </div>
    </div>
    <div :class="$style.main">
      <song-list-list v-if="searchType == 'songlist'" v-show="searchText" :page="page" :source-id="source" />
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
import { listInfos as musicListInfos } from '@renderer/store/search/music/state'
import { listInfos as songListInfos } from '@renderer/store/search/songlist/state'

import MusicList from './MusicList/index.vue'
import SongListList from './SongListList/index.vue'
import BlankView from './components/BlankView.vue'
import { computed, ref } from '@common/utils/vueTools'
import { sourceNames } from '@renderer/store'

const source = ref('all')
const searchType = ref(null)
const page = ref(1)
const landingQuery = ref('')

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
  source.value = _source
  searchType.value = _type

  if (_page) page.value = parseInt(_page)

  if (to.query.text != null) {
    searchText.value = to.query.text
    landingQuery.value = to.query.text
    if (!_page) page.value = 1
  } else {
    searchText.value = ''
    landingQuery.value = ''
  }
  next()
  void setSearchSetting({ source: _source, type: _type })
}

export default {
  components: {
    MusicList,
    SongListList,
    BlankView,
  },
  beforeRouteEnter: verifyQueryParams,
  beforeRouteUpdate: verifyQueryParams,
  setup() {
    const route = useRoute()
    const router = useRouter()

    const sources = _sources.map(id => {
      return {
        id,
        label: sourceNames.value[id],
      }
    })
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

    const resultCount = computed(() => {
      const infos = searchType.value == 'songlist' ? songListInfos : musicListInfos
      return infos[source.value]?.total ?? 0
    })

    const pageTitle = computed(() => {
      return searchText.value
        ? window.i18n.t('search__results')
        : window.i18n.t('search__landing_title')
    })

    const submitLanding = () => {
      if (!landingQuery.value) return
      void router.replace({
        path: '/search',
        query: {
          ...route.query,
          text: landingQuery.value,
          page: 1,
        },
      })
    }

    const clearLanding = () => {
      landingQuery.value = ''
      const query = { ...route.query }
      delete query.text
      void router.replace({
        path: '/search',
        query,
      })
    }

    return {
      sources,
      sourceSelectList: sources,
      source,
      handleSourceChange,
      searchTypes,
      searchType,
      handleTypeChange,
      page,
      searchText,
      landingQuery,
      submitLanding,
      clearLanding,
      pageTitle,
      resultCount,
    }
  },
}


</script>

<style lang="less" module>
.container {
  display: flex;
  flex-flow: column nowrap;
  padding: 29px 32px 0;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  :global(.search-big) {
    flex: none;
  }
}

.pageHead {
  flex: none;
}

.sourceSelect {
  flex: none;
  width: auto;
  font-size: 12px;
}

.clearBtn {
  flex: none;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--color-secondary);
  display: grid;
  place-items: center;
  cursor: pointer;
  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
  }
  &:hover {
    color: var(--color-primary);
    background: var(--color-well);
  }
}

.header {
  flex: none;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  margin: 20px 0 16px;
}

.main {
  position: relative;
  flex: auto;
  min-height: 0;
}

@media (max-width: 920px) {
  .container {
    padding: 16px 16px 0;
  }
}
</style>
