<template>
<material-search-input @event="handleEvent" :list="tipList" :visibleList="visibleList" v-model="searchText" />
</template>

<script>
import music from '@renderer/utils/music'
import { debounce } from '@renderer/utils'
import {
  ref,
  useRoute,
  watch,
  useRefGetter,
  useRouter,
  nextTick,
  useCommit,
} from '@renderer/utils/vueTools'

export default {
  setup() {
    const searchText = ref('')
    const visibleList = ref(false)
    const tipList = ref([])
    let isFocused = false

    const route = useRoute()
    const router = useRouter()

    const setting = useRefGetter('setting')

    const clearSearchList = useCommit('search', 'clearList')

    watch(() => route.name, (newValue, oldValue) => {
      if (newValue.name != 'search') {
        if (setting.value.odc.isAutoClearSearchInput && searchText.value) searchText.value = ''
        if (setting.value.odc.isAutoClearSearchList) clearSearchList()
      }
    })

    const storeSearchText = useRefGetter('search', 'searchText')
    watch(storeSearchText, (newValue, oldValue) => {
      searchText.value = newValue
      if (newValue !== searchText.value) searchText.value = newValue
    })
    watch(searchText, () => {
      handleTipSearch()
    })


    const tipSearch = debounce(() => {
      if (searchText.value === '') {
        tipList.value = []
        music[setting.value.search.tempSearchSource].tempSearch.cancelTempSearch()
        return
      }
      music[setting.value.search.tempSearchSource].tempSearch.search(searchText.value).then(list => {
        tipList.value = list
      }).catch(() => {})
    }, 50)

    const handleTipSearch = () => {
      if (!visibleList.value && isFocused) visibleList.value = true
      tipSearch()
    }

    const handleSearch = () => {
      if (visibleList.value) visibleList.value = false
      setTimeout(() => {
        router.push({
          path: 'search',
          query: {
            text: searchText.value,
          },
        }).catch(_ => _)
      }, 200)
    }

    const handleEvent = ({ action, data }) => {
      switch (action) {
        case 'focus':
          isFocused = true
          if (!visibleList.value) visibleList.value = true
          if (searchText.value) handleTipSearch()
          break
        case 'blur':
          isFocused = false
          setTimeout(() => {
            if (visibleList.value) visibleList.value = false
          }, 50)
          break
        case 'submit':
          handleSearch()
          break
        case 'listClick':
          searchText.value = tipList.value[data]
          nextTick(handleSearch)
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
