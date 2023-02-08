import Event from './Event'


// {
//   // sync: {
//   //   send_action_list: 'send_action_list',
//   //   handle_action_list: 'handle_action_list',
//   //   send_sync_list: 'send_sync_list',
//   //   handle_sync_list: 'handle_sync_list',
//   // },
// }

export class AppEvent extends Event {
  configUpdate() {
    this.emit('configUpdate')
  }

  focus() {
    this.emit('focus')
  }

  dragStart() {
    this.emit('dragStart')
  }

  dragEnd() {
    this.emit('dragEnd')
  }

  /**
   * 音乐信息切换
   */
  musicToggled() {
    this.emit('musicToggled')
  }

  /**
   * 手动改变进度
   * @param progress 进度
   */
  setProgress(progress: number, maxPlayTime?: number) {
    this.emit('setProgress', progress, maxPlayTime)
  }

  /**
   * 设置音量大小
   * @param volume 音量大小
   */
  setVolume(volume: number) {
    this.emit('setVolume', volume)
  }

  /**
   * 设置播放速率大小
   * @param rate 播放速率
   */
  setPlaybackRate(rate: number) {
    this.emit('setPlaybackRate', rate)
  }

  /**
   * 设置是否静音
   * @param isMute 是否静音
   */
  setVolumeIsMute(isMute: boolean) {
    this.emit('setVolumeIsMute', isMute)
  }

  // 播放器事件
  play() {
    this.emit('play')
  }

  pause() {
    this.emit('pause')
  }

  stop() {
    this.emit('stop')
  }

  error(code?: number) {
    this.emit('error', code)
  }

  // 播放器原始事件
  playerPlaying() {
    this.emit('playerPlaying')
  }

  playerPause() {
    this.emit('playerPause')
  }

  playerStop() {
    this.emit('playerStop')
  }

  playerEnded() {
    this.emit('playerEnded')
  }

  playerError(code?: number) {
    this.emit('playerError', code)
  }

  playerLoadeddata() {
    this.emit('playerLoadeddata')
  }

  playerLoadstart() {
    this.emit('playerLoadstart')
  }

  playerCanplay() {
    this.emit('playerCanplay')
  }

  playerEmptied() {
    this.emit('playerEmptied')
  }

  playerWaiting() {
    this.emit('playerWaiting')
  }

  // 激活进度条动画事件
  activePlayProgressTransition() {
    this.emit('activePlayProgressTransition')
  }

  // 更新图片事件
  picUpdated() {
    this.emit('picUpdated')
  }

  // 更新歌词事件
  lyricUpdated() {
    this.emit('lyricUpdated')
  }

  // 更新歌词偏移
  lyricOffsetUpdate() {
    this.emit('lyricOffsetUpdate')
  }

  // 我的列表改变事件
  myListUpdate(ids: string[]) {
    this.emit('myListUpdate', ids)
  }

  // 下载列表改变事件
  downloadListUpdate() {
    this.emit('downloadListUpdate')
  }

  // 列表里的音乐信息改变事件
  // musicInfoUpdate(musicInfo: LX.Music.MusicInfo) {
  //   this.emit('musicInfoUpdate', musicInfo)
  // }

  keyDown(event: LX.KeyDownEevent) {
    this.emit('keyDown', event)
  }
}


type EventMethods = Omit<EventType, keyof Event>


declare class EventType extends AppEvent {
  on<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
  off<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
}

export type AppEventTypes = Omit<EventType, keyof Omit<Event, 'on' | 'off'>>
export const createAppEventHub = (): AppEventTypes => {
  return new AppEvent()
}
