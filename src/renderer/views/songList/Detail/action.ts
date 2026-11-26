import { tempListMeta, userLists } from '@renderer/store/list/state'
import { dialog } from '@renderer/plugins/Dialog'
import syncSourceList from '@renderer/store/list/syncSourceList'
import { getListDetail, getListDetailAll } from '@renderer/store/songList/action'
import { listDetailInfo } from '@renderer/store/songList/state'
import { createUserList, setTempList } from '@renderer/store/list/action'
import { playList } from '@renderer/core/player/action'
import { LIST_IDS } from '@common/constants'
import { toMD5 } from '@renderer/utils'
import { normalizeYtmPlaylistId } from '@renderer/utils/musicSdk/ytm/parser'

const normalizeSourceListId = (id: string, source: LX.OnlineSource) => (
  source === 'ytm' ? (normalizeYtmPlaylistId(id) ?? id) : id
)

const getListId = (id: string, source: LX.OnlineSource) => `${source}__${normalizeSourceListId(id, source)}`

export const addSongListDetail = async(id: string, source: LX.OnlineSource, name?: string) => {
  // console.log(this.listDetail.info)
  // if (!this.listDetail.info.name) return
  // 在 await 之前快照详情页元数据，避免等待期间详情页被切换导致读到其它歌单的封面/简介/作者
  const info = { ...listDetailInfo.info }
  const canonicalId = normalizeSourceListId(id, source)
  const listId = getListId(canonicalId, source)
  // sourceListId 落库的是规范化后的原始歌单 id（见下方 createUserList），按原始 id + 音源匹配已收藏列表
  const targetList = userLists.find(l => (
    l.source == source && (
      l.sourceListId == canonicalId ||
      (source === 'ytm' && normalizeYtmPlaylistId(l.sourceListId ?? '') === canonicalId)
    )
  ))
  if (targetList) {
    const confirm = await dialog.confirm({
      message: window.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: window.i18n.t('lists__import_part_button_cancel'),
      confirmButtonText: window.i18n.t('confirm_button_text'),
    })
    if (!confirm) return
    // 同步失败会写入列表更新错误；这里消费拒绝，避免重复收藏操作产生 unhandled rejection。
    await syncSourceList(targetList).catch(() => {})
    return
  }

  const list = await getListDetailAll(canonicalId, source, source === 'ytm', source === 'ytm' ? { failOnTruncated: true } : undefined)
  await createUserList({
    name: name ?? info.name,
    id: `${source}_${toMD5(listId)}`,
    list,
    source,
    sourceListId: canonicalId,
    cover: info.img,
    desc: info.desc,
    author: info.author,
  })
}

export const playSongListDetail = async(id: string, source: LX.OnlineSource, list?: LX.Music.MusicInfoOnline[], index: number = 0) => {
  let isPlayingList = false
  // console.log(list)
  const canonicalId = normalizeSourceListId(id, source)
  const listId = getListId(canonicalId, source)
  if (!list?.length) list = (await getListDetail(canonicalId, source, 1)).list
  if (list?.length) {
    await setTempList(listId, [...list])
    playList(LIST_IDS.TEMP, index)
    isPlayingList = true
  }
  const fullList = await getListDetailAll(canonicalId, source)
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
