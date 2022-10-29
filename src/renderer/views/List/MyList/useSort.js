import { ref, reactive } from '@common/utils/vueTools'


export default () => {
  const isShowListSortModal = ref(false)
  const sortListInfo = reactive({ id: '', name: '' })

  const handleSortList = (listInfo) => {
    sortListInfo.id = listInfo.id
    sortListInfo.name = listInfo.name
    isShowListSortModal.value = true
  }

  return {
    isShowListSortModal,
    sortListInfo,
    handleSortList,
  }
}
