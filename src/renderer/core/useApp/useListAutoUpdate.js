import { getListUpdateInfo } from '@renderer/utils/data'
import useSyncSourceList from '@renderer/utils/compositions/useSyncSourceList'
import { userLists } from '@renderer/core/share/list'

export default () => {
  const syncSourceList = useSyncSourceList()


  const handleSyncSourceList = async(waitUpdateLists) => {
    if (!waitUpdateLists.length) return
    const targetListInfo = waitUpdateLists.shift()
    // console.log(targetListInfo)
    try {
      await syncSourceList(targetListInfo)
    } catch {}
    handleSyncSourceList(waitUpdateLists)
  }

  return () => {
    const waitUpdateLists = Object.entries(getListUpdateInfo())
      .map(([id, info]) => info.isAutoUpdate && userLists.find(l => l.id === id))
      .filter(_ => _)
    for (let i = 2; i > 0; i--) {
      handleSyncSourceList(waitUpdateLists)
    }
  }
}
