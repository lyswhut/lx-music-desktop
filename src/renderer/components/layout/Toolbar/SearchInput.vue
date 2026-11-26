<template>
  <material-search-input v-model="searchText" :list="tipList" :visible-list="visibleList" @event="handleEvent" />
</template>

<script>
import music from '@renderer/utils/musicSdk'
import { debounce } from '@common/utils'
import {
  ref,
  watch,
  nextTick,
} from '@common/utils/vueTools'
import { useRouter, useRoute } from '@common/utils/vueRouter'
import { appSetting } from '@renderer/store/setting'
import { searchText as _searchText } from '@renderer/store/search/state'
import { setSearchText } from '@renderer/store/search/action'
import { getSearchSetting } from '@renderer/utils/data'

export default {
  setup() {
    const searchText = ref('')
    const visibleList = ref(false)
    const tipList = ref([])
    let isFocused = false
    let prevTempSearchSource = ''

    const route = useRoute()
    const router = useRouter()

    watch(() => route.name, (newValue, oldValue) => {
      if (oldValue == 'Search' && newValue != 'SongListDetail') {
        setTimeout(() => {
          if (appSetting['odc.isAutoClearSearchInput'] && searchText.value) searchText.value = ''
          if (appSetting['odc.isAutoClearSearchList']) setSearchText('')
        })
      }
    })

    watch(_searchText, (newValue, oldValue) => {
      searchText.value = newValue
      if (newValue !== searchText.value) searchText.value = newValue
    })
    watch(searchText, () => {
      handleTipSearch()
    })


    let tipSearchSeq = 0
    const tipSearch = debounce(async() => {
      const seq = ++tipSearchSeq
      const text = searchText.value
      if (text === '') {
        tipList.value = []
        if (prevTempSearchSource) {
          music[prevTempSearchSource]?.tipSearch?.cancelTipSearch?.()
        }
        return
      }
      const routeSource = route.path == '/search' ? route.query.source : ''
      const { temp_source } = await getSearchSetting()
      if (seq !== tipSearchSeq || searchText.value === '') return
      const targetSource = routeSource === 'ytm' && music.ytm?.tipSearch ? 'ytm' : temp_source
      if (prevTempSearchSource && prevTempSearchSource !== targetSource) {
        music[prevTempSearchSource]?.tipSearch?.cancelTipSearch?.()
      }
      prevTempSearchSource = targetSource
      music[prevTempSearchSource]?.tipSearch?.search(text).then(list => {
        if (seq !== tipSearchSeq || searchText.value !== text) return
        tipList.value = list
      }).catch(() => {})
    }, 50)

    const handleTipSearch = () => {
      if (!visibleList.value && isFocused) visibleList.value = true
      tipSearch()
    }

    const handleSearch = () => {
      visibleList.value &&= false
      if (!searchText.value && route.path != '/search') {
        setSearchText('')
        return
      }
      setTimeout(() => {
        router.push({
          path: '/search',
          query: {
            text: searchText.value,
          },
        }).catch(_ => _)
      }, searchText.value ? 200 : 0)
    }

    const handleEvent = ({ action, data }) => {
      switch (action) {
        case 'focus':
          isFocused = true
          visibleList.value ||= true
          if (searchText.value) handleTipSearch()
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
          searchText.value = tipList.value[data]
          void nextTick(handleSearch)
      }
    }

    return {
      searchText,
      visibleList,
      tipList,
      handleEvent,
    }
  },
}

</script>
