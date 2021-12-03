const names = {
  base: {
    key_down: 'key_down',
    bindKey: 'bindKey',
    unbindKey: 'unbindKey',
    focus: 'focus',
    min: 'min',
    max: 'max',
    close: 'close',
    set_config: 'set_config',
    set_hot_key_config: 'set_hot_key_config',
  },
  player: {
    playMusic: 'playMusic',
    setTogglePlay: 'setTogglePlay',
    setProgress: 'setProgress',
    play: 'play',
    setPlay: 'setPlay',
    pause: 'pause',
    setPause: 'setPause',
    stop: 'stop',
    setStop: 'setStop',
    error: 'error',
    setPlayPrev: 'setPlayPrev',
    setPlayNext: 'setPlayNext',

    updatePic: 'updatePic',
    updateLyric: 'updateLyric',
    setPlayInfo: 'setPlayInfo',

    activeTransition: 'activeTransition',

    setVolume: 'setVolume',
    toggleMute: 'toggleMute',
    volume: 'volume',

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
    saveMyList: 'saveMyList',
    listChange: 'listChange',
    musicInfoChange: 'musicInfoChange',
  },
  download: {
    listChange: 'listChange',
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
