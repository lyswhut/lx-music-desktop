import { ref } from '@common/utils/vueTools'
import { dialog } from '@renderer/plugins/Dialog'
import syncSourceList from '@renderer/store/list/syncSourceList'
import { useI18n } from '@renderer/plugins/i18n'


export default () => {
  const isShowListUpdateModal = ref(false)

  const t = useI18n()

  const handleUpdateSourceList = (listInfo: LX.List.UserListInfo) => {
    void dialog.confirm({
      message: t('lists__sync_confirm_tip', { name: listInfo.name }),
      confirmButtonText: t('lists__remove_tip_button'),
    }).then(isSync => {
      if (!isSync) return
      void syncSourceList(listInfo)
    })
  }

  return {
    isShowListUpdateModal,
    handleUpdateSourceList,
  }
}
