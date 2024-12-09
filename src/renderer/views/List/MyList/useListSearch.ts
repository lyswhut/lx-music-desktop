import { ref } from '@common/utils/vueTools'

export default ({
  emit,
}: {
  emit: (event: 'show-menu' | 'search', ...args: any[]) => void
}) => {
  const isShowListSearch = ref(false)
  const isListSearchLeave = ref(false)

  const handleOpenSearch = async() => {
    isShowListSearch.value = true
  }

  const handleSearch = async(event: Event) => {
    const target = event.target as HTMLInputElement
    const content = target.value.trim()
    emit('search', content)
  }

  const handleCloseSearch = () => {
    isShowListSearch.value = false
    isListSearchLeave.value = true
    emit('search', '')
  }

  return {
    handleOpenSearch,
    isShowListSearch,
    isListSearchLeave,
    handleSearch,
    handleCloseSearch,
  }
}
