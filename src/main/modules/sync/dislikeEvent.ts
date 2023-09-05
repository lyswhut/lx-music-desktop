
export const getLocalDislikeData = async(): Promise<LX.Dislike.DislikeRules> => {
  return (await global.lx.worker.dbService.getDislikeListInfo()).rules
}

export const setLocalDislikeData = async(listData: LX.Dislike.DislikeRules) => {
  await global.lx.event_dislike.dislike_data_overwrite(listData, true)
}

export const registerDislikeActionEvent = (sendDislikeAction: (action: LX.Sync.Dislike.ActionList) => (void | Promise<void>)) => {
  const dislike_music_add = async(listData: LX.Dislike.DislikeMusicInfo[], isRemote: boolean = false) => {
    if (isRemote) return
    await sendDislikeAction({ action: 'dislike_music_add', data: listData })
  }
  const dislike_data_overwrite = async(listInfos: LX.Dislike.DislikeRules, isRemote: boolean = false) => {
    if (isRemote) return
    await sendDislikeAction({ action: 'dislike_data_overwrite', data: listInfos })
  }
  const dislike_music_clear = async(isRemote: boolean = false) => {
    if (isRemote) return
    await sendDislikeAction({ action: 'dislike_music_clear' })
  }

  global.lx.event_dislike.on('dislike_music_add', dislike_music_add)
  global.lx.event_dislike.on('dislike_data_overwrite', dislike_data_overwrite)
  global.lx.event_dislike.on('dislike_music_clear', dislike_music_clear)
  return () => {
    global.lx.event_dislike.off('dislike_music_add', dislike_music_add)
    global.lx.event_dislike.off('dislike_data_overwrite', dislike_data_overwrite)
    global.lx.event_dislike.off('dislike_music_clear', dislike_music_clear)
  }
}

export const handleRemoteDislikeAction = async(event: LX.Sync.Dislike.ActionList) => {
  // console.log('handleRemoteDislikeAction', event)

  switch (event.action) {
    case 'dislike_music_add':
      await global.lx.event_dislike.dislike_music_add(event.data, true)
      break
    case 'dislike_data_overwrite':
      await global.lx.event_dislike.dislike_data_overwrite(event.data, true)
      break
    case 'dislike_music_clear':
      await global.lx.event_dislike.dislike_music_clear(true)
      break
    default:
      throw new Error('unknown list sync action')
  }
}
