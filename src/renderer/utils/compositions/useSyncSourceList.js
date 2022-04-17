import { setListUpdateTime } from '@renderer/utils/data'
import { setFetchingListStatus } from '@renderer/core/share/list'
import { useAction, useCommit } from '@renderer/utils/vueTools'

export default () => {
  const getBoardListAll = useAction('leaderboard', 'getListAll')
  const getListDetailAll = useAction('songList', 'getListDetailAll')
  const setList = useCommit('list', 'setList')

  const fetchList = (id, source, sourceListId) => {
    setFetchingListStatus(id, true)

    let promise
    if (/board__/.test(sourceListId)) {
      const id = sourceListId.replace(/board__/, '')
      promise = getBoardListAll({ id, isRefresh: true })
    } else {
      promise = getListDetailAll({ source, id: sourceListId, isRefresh: true })
    }
    return promise.finally(() => {
      setFetchingListStatus(id, false)
    })
  }

  return async targetListInfo => {
    const list = await fetchList(targetListInfo.id, targetListInfo.source, targetListInfo.sourceListId)
    // console.log(targetListInfo.list.length, list.length)
    setList({
      ...targetListInfo,
      list,
    })
    setListUpdateTime(targetListInfo.id, Date.now())
  }
}
