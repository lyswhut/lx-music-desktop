import { setListUpdateTime, setListUpdateError } from '@renderer/utils/data'
import { setFetchingListStatus, overwriteListMusics, setUpdateTime } from './action'
import { getListDetailAll } from '@renderer/store/songList/action'
import { getListDetailAll as getBoardListAll } from '@renderer/store/leaderboard/action'
import { dateFormat } from '@common/utils/common'

const fetchList = async(id: string, source: LX.OnlineSource, sourceListId: string) => {
  setFetchingListStatus(id, true)

  let promise
  if (/^board__/.test(sourceListId)) {
    const id = sourceListId.replace(/^board__/, '')
    promise = id ? getBoardListAll(id, true, { failOnTruncated: true }) : Promise.reject(new Error('id not defined: ' + sourceListId))
  } else {
    promise = getListDetailAll(sourceListId, source, true, { failOnTruncated: true })
  }
  return promise.finally(() => {
    setFetchingListStatus(id, false)
  })
}

const getErrorMsg = (err: unknown) => {
  if (err instanceof Error) return err.message
  if (typeof err == 'object' && err !== null && 'message' in err) return String((err as { message: unknown }).message)
  return String(err)
}

export default async(targetListInfo: LX.List.UserListInfo) => {
  // console.log(targetListInfo)
  if (!targetListInfo.source || !targetListInfo.sourceListId) return
  try {
    const list = await fetchList(targetListInfo.id, targetListInfo.source, targetListInfo.sourceListId)
    // 只有歌曲实际落库成功后才记录成功时间；否则下次启动会错误跳过更新。
    await overwriteListMusics({ listId: targetListInfo.id, musicInfos: list })
    const now = Date.now()
    await setListUpdateTime(targetListInfo.id, now)
    await setListUpdateError(targetListInfo.id, null)
    setUpdateTime(targetListInfo.id, dateFormat(now))
  } catch (err) {
    // 更新失败时记录错误信息，保留本地旧数据，等待下次启动自动更新时重试
    await setListUpdateError(targetListInfo.id, getErrorMsg(err)).catch(() => {})
    throw err
  }
}
