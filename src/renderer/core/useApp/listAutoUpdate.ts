import { getListUpdateInfo } from '@renderer/utils/data'
import { userLists } from '@renderer/store/list/state'
import syncSourceList from '@renderer/store/list/syncSourceList'

const handleSyncSourceList = async(waitUpdateLists: LX.List.UserListInfo[]) => {
  if (!waitUpdateLists.length) return
  const targetListInfo = waitUpdateLists.shift() as LX.List.UserListInfo
  // console.log(targetListInfo)
  try {
    await syncSourceList(targetListInfo)
  } catch {}
  void handleSyncSourceList(waitUpdateLists)
}

export default () => {
  void getListUpdateInfo().then(listUpdateInfo => {
    const waitUpdateLists = Object.entries(listUpdateInfo)
      .map(([id, info]) => info.isAutoUpdate && userLists.find(l => l.id == id))
      .filter(_ => _) as LX.List.UserListInfo[]
    // for (let i = 2; i > 0; i--) {
    //   void handleSyncSourceList(waitUpdateLists)
    void handleSyncSourceList(waitUpdateLists)
    // }
  })
}
