import { DISLIKE_EVENT_NAME } from '@common/ipcNames'

// 发送列表操作事件到渲染进程的注册方法
// 哪个渲染进程需要接收则引入此方法注册
export const registerRendererEvents = (sendEvent: <T = any>(name: string, params?: T | undefined) => void) => {
  const dislike_music_add = async(listData: LX.Dislike.DislikeMusicInfo[]) => {
    sendEvent<LX.Dislike.DislikeMusicInfo[]>(DISLIKE_EVENT_NAME.add_dislike_music_infos, listData)
  }
  const dislike_data_overwrite = async(rules: LX.Dislike.DislikeRules) => {
    sendEvent<LX.Dislike.DislikeRules>(DISLIKE_EVENT_NAME.overwrite_dislike_music_infos, rules)
  }
  const dislike_music_clear = async() => {
    sendEvent(DISLIKE_EVENT_NAME.clear_dislike_music_infos)
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
