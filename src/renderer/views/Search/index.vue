<template>
  <div :class="$style.container">
    <div :class="$style.header">
      <div :class="$style.searchBox">
        <div :class="$style.searchTitle">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="0 0 425.2 425.2" :class="$style.searchIcon" space="preserve">
            <use xlink:href="#icon-search-2" />
          </svg>
          <span :class="$style.searchText">搜索</span>
        </div>
        <div :class="$style.searchInputWrap">
          <material-search-input v-model="inputText" :list="tipList" :visible-list="visibleList" :big="true" @event="handleEvent" />
        </div>
      </div>
      <div :class="$style.tabRow">
        <base-tab v-model="source" :list="sources" @change="handleSourceChange" />
        <div :class="$style.rightTab"><base-tab v-model="searchType" :list="searchTypes" type="segment" align="right" @change="handleTypeChange" /></div>
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
import { setSearchText } from '@renderer/store/search/action'
import { getSearchSetting, setSearchSetting } from '@renderer/utils/data'
import { sources as _sources } from '@renderer/store/search/music'
import music from '@renderer/utils/musicSdk'
import { debounce } from '@common/utils'

import MusicList from './MusicList/index.vue'
import SongListList from './SongListList/index.vue'
import BlankView from './components/BlankView.vue'
import { computed, ref, watch, nextTick } from '@common/utils/vueTools'
import { sourceNames } from '@renderer/store'

const source = ref('all')
const searchType = ref(null)
const page = ref(1)

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
    if (!_page) page.value = 1
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

    const inputText = ref('')
    const visibleList = ref(false)
    const tipList = ref([])
    let isFocused = false
    let prevTempSearchSource = ''

    watch(searchText, (newValue) => {
      inputText.value = newValue
    }, { immediate: true })
    watch(inputText, () => {
      handleTipSearch()
    })

    const tipSearch = debounce(async() => {
      if (inputText.value === '' && prevTempSearchSource) {
        tipList.value = []
        music[prevTempSearchSource].tipSearch.cancelTipSearch()
        return
      }
      const { temp_source } = await getSearchSetting()
      prevTempSearchSource ||= temp_source
      music[prevTempSearchSource].tipSearch.search(inputText.value).then(list => {
        tipList.value = list
      }).catch(() => {})
    }, 50)

    const handleTipSearch = () => {
      if (!visibleList.value && isFocused) visibleList.value = true
      tipSearch()
    }

    const handleSearch = () => {
      visibleList.value &&= false
      if (!inputText.value) {
        setSearchText('')
        if (route.query.text) {
          void router.replace({
            path: route.path,
            query: {
              ...route.query,
              text: '',
              page: 1,
            },
          }).catch(_ => _)
        }
        return
      }
      setSearchText(inputText.value)
      void router.replace({
        path: route.path,
        query: {
          ...route.query,
          text: inputText.value,
          page: 1,
        },
      }).catch(_ => _)
    }

    const handleEvent = ({ action, data }) => {
      switch (action) {
        case 'focus':
          isFocused = true
          visibleList.value ||= true
          if (inputText.value) handleTipSearch()
          break
        case 'blur':
          isFocused = false
          setTimeout(() => {
            visibleList.value &&= false
          }, 50)
          break
        case 'submit':
          handleSearch()
          break
        case 'listClick':
          inputText.value = tipList.value[data]
          void nextTick(handleSearch)
      }
    }

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

    return {
      sources,
      source,
      handleSourceChange,
      searchTypes,
      searchType,
      handleTypeChange,
      page,
      searchText,
      inputText,
      visibleList,
      tipList,
      handleEvent,
    }
  },
}


</script>

<style lang="less" module>
.container {
  display: flex;
  flex-flow: column nowrap;
  padding-top: 0;
  margin-top: 0;
}

.header {
  flex: none;
  display: flex;
  flex-flow: column nowrap;
}

.searchBox {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  padding: 20px 15px 4px;
}

.searchTitle {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  margin-top: 0;
  color: var(--color-primary);
}

.searchIcon {
  flex: none;
  width: 44px;
  height: 44px;
  margin-right: 12px;
  margin-top: 0;
}

.searchText {
  font-size: 40px;
  font-weight: 500;
  line-height: 1;
}

.searchInputWrap {
  width: 60%;
  min-width: 480px;
  position: relative;
  height: 40px;
}

.tabRow {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
}

.rightTab {
  margin-right: 15px;
}

.main {
  position: relative;
  flex: auto;
}
</style>
