const names = {
  base: {
    key_down: 'key_down',
    bindKey: 'bindKey',
    unbindKey: 'unbindKey',
    dragStart: 'dragStart',
    dragEnd: 'dragEnd',
    setClearDownKeys: 'setClearDownKeys',
    focus: 'focus',
    min: 'min',
    max: 'max',
    close: 'close',
    set_config: 'set_config',
    set_hot_key_config: 'set_hot_key_config',
  },
  player: {
    setTogglePlay: 'setTogglePlay', // 播放/暂停切换
    setPause: 'setPause', // 暂停
    setStop: 'setStop', // 停止
    setPlayPrev: 'setPlayPrev', // 上一曲
    setPlayNext: 'setPlayNext', // 下一曲
    setProgress: 'setProgress', // 设置播放进度
    setVolume: 'setVolume', // 设置音量
    toggleMute: 'toggleMute', // 静音切换


    playMusic: 'playMusic',

    setPlayInfo: 'setPlayInfo',
    updatePic: 'updatePic',
    updateLyric: 'updateLyric',

    activeTransition: 'activeTransition', // 激活进度条动画事件

    // 播放器事件
    play: 'play',
    pause: 'pause',
    stop: 'stop',
    error: 'error',

    // 播放器原始事件
    player_playing: 'player_playing',
    player_pause: 'player_pause',
    player_stop: 'player_stop',
    player_ended: 'player_ended',
    player_error: 'player_error',
    player_loadeddata: 'player_loadeddata',
    player_loadstart: 'player_loadstart',
    player_canplay: 'player_canplay',
    player_emptied: 'player_emptied',
    player_waiting: 'player_waiting',
  },
  list: {
    saveMyList: 'saveMyList', // 列表保存事件
    listChange: 'listChange', // 列表改变事件
    musicInfoChange: 'musicInfoChange', // 列表里的音乐信息改变事件
  },
  download: {
    listChange: 'listChange', // 列表改变事件
  },
  sync: {
    send_action_list: 'send_action_list',
    handle_action_list: 'handle_action_list',
    send_sync_list: 'send_sync_list',
    handle_sync_list: 'handle_sync_list',
  },
}

for (const item of Object.keys(names)) {
  let name = names[item]
  for (const key of Object.keys(name)) {
    name[key] = `${item}_${name[key]}`
  }
}

export const base = names.base
export const player = names.player
export const list = names.list
export const download = names.download
export const sync = names.sync
