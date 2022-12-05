import { tempListMeta, userLists } from '@renderer/store/list/state'
import { dialog } from '@renderer/plugins/Dialog'
import syncSourceList from '@renderer/store/list/syncSourceList'
import { getListDetail, getListDetailAll } from '@renderer/store/leaderboard/action'
import { createUserList, setTempList } from '@renderer/store/list/action'
import { playList } from '@renderer/core/player/action'
import { LIST_IDS } from '@common/constants'

const getListId = (id: string) => `board__${id}`

export const addSongListDetail = async(id: string, name: string, source: LX.OnlineSource) => {
  // console.log(this.listDetail.info)
  // if (!this.listDetail.info.name) return
  const listId = getListId(id)
  const targetList = userLists.find(l => l.id == listId)
  if (targetList) {
    const confirm = await dialog.confirm({
      message: window.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: window.i18n.t('lists__import_part_button_cancel'),
      confirmButtonText: window.i18n.t('confirm_button_text'),
    })
    if (!confirm) return
    void syncSourceList(targetList)
    return
  }

  const list = await getListDetailAll(id)
  await createUserList({
    name,
    id: listId,
    list,
    source,
    sourceListId: listId,
  })
}

export const playSongListDetail = async(id: string, list?: LX.Music.MusicInfoOnline[], index: number = 0) => {
  let isPlayingList = false
  // console.log(list)
  const listId = getListId(id)
  if (!list?.length) list = (await getListDetail(id, 1)).list
  if (list?.length) {
    await setTempList(listId, [...list])
    playList(LIST_IDS.TEMP, index)
    isPlayingList = true
  }
  const fullList = await getListDetailAll(id)
  if (!fullList.length) return
  if (isPlayingList) {
    if (tempListMeta.id == listId) {
      await setTempList(listId, [...fullList])
    }
  } else {
    await setTempList(listId, [...fullList])
    playList(LIST_IDS.TEMP, index)
  }
}
