<template>
  <div :class="$style.container">
    <div :class="$style.header">
      <div :class="$style.title">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" viewBox="-10 -5 440 445" height="36" space="preserve">
          <use xlink:href="#icon-search-2" />
        </svg>
        <span>{{ t('search') }}</span>
      </div>
      <div :class="$style.searchBox">
        <search-input big />
      </div>
      <div :class="$style.subHeader">
        <div :class="$style.sourceWrap">
          <span :class="$style.subLabel">{{ t('search__category') }}:</span>
          <div :class="$style.sourceTab">
            <button
              v-for="item in sources"
              :key="item.id"
              type="button"
              :class="[$style.sourceBtn, { [$style.sourceBtnActive]: source == item.id }]"
              @click="handleSourceChange(item.id)"
            >{{ item.label }}</button>
          </div>
        </div>
        <div :class="$style.typeWrap">
          <span :class="$style.subLabel">分类:</span>
          <div :class="$style.typeSegmented">
            <button
              v-for="item in searchTypes"
              :key="item.id"
              type="button"
              :class="[$style.segmentedBtn, { [$style.segmentedBtnActive]: searchType == item.id }]"
              @click="handleTypeChange(item.id)"
            >{{ item.label }}</button>
          </div>
        </div>
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
import { useI18n } from '@root/lang'

import MusicList from './MusicList/index.vue'
import SongListList from './SongListList/index.vue'
import BlankView from './components/BlankView.vue'
import SearchInput from '@renderer/components/layout/Toolbar/SearchInput.vue'
import { computed, ref } from '@common/utils/vueTools'
import { sourceNames } from '@renderer/store'

const source = ref('kw')
const searchType = ref('music')
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
    SearchInput,
  },
  beforeRouteEnter: verifyQueryParams,
  beforeRouteUpdate: verifyQueryParams,
  setup() {
    const t = useI18n()
    const route = useRoute()
    const router = useRouter()

    const sources = _sources.map(id => {
      return {
        id,
        label: sourceNames.value[id],
      }
    })
    const handleSourceChange = (id) => {
      if (id == source.value) return
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
        { label: t('search__type_music'), id: 'music' },
        { label: t('search__type_songlist'), id: 'songlist' },
      ]
    })
    const handleTypeChange = (type) => {
      if (type == searchType.value) return
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
      t,
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
@import '@renderer/assets/styles/layout.less';

.container {
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
}

.header {
  flex: none;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  padding: 10px 20px 5px;
  gap: 10px;
}

.title {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);

  svg {
    display: block;
  }

  span {
    font-size: 36px;
    font-weight: 500;
    line-height: 1;
  }
}

.searchBox {
  width: 60%;
  max-width: 600px;
  min-width: 280px;

  :deep(.container) {
    width: 100%;
  }
}

.subHeader {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 4px;
  margin-top: 0;
  border-bottom: 1px solid var(--color-primary-light-400-alpha-300);
}

.sourceTab {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0;
}

.sourceBtn {
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-font);
  font-size: 13px;
  padding: 6px 6px;
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

.sourceWrap {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
}

.typeWrap {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  flex: 0 0 auto;
  gap: 6px;
}

.typeSegmented {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  border: 1px solid var(--color-primary);
  border-radius: 13px;
  overflow: hidden;
  height: 26px;
}

.segmentedBtn {
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 500;
  padding: 0 13px;
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(.segmentedBtnActive) {
    background-color: var(--color-primary-light-400-alpha-300);
  }
}

.segmentedBtnActive {
  background-color: var(--color-primary);
  color: #fff;

  &:hover {
    background-color: var(--color-primary);
  }
}

.subLabel {
  color: var(--color-font-label);
  font-size: 13px;
  flex: none;
  margin-right: 6px;
}

.main {
  position: relative;
  flex: auto;
  min-height: 0;
}
</style>
