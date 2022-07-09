const names = require('@main/events/_name')
const hotKey = {
  common: {
    min: {
      name: 'min',
      action: 'min',
    },
    min_toggle: {
      name: 'toggle_min',
      action: 'toggle_min',
    },
    hide_toggle: {
      name: 'toggle_hide',
      action: 'toggle_hide',
    },
    close: {
      name: 'toggle_close',
      action: 'toggle_close',
    },
    focusSearchInput: {
      name: 'focus_search_input',
      action: 'focus_search_input',
    },
  },
  player: {
    toggle_play: {
      name: 'toggle_play',
      action: 'toggle_play',
    },
    next: {
      name: 'next',
      action: 'next',
    },
    prev: {
      name: 'prev',
      action: 'prev',
    },
    volume_up: {
      name: 'volume_up',
      action: 'volume_up',
    },
    volume_down: {
      name: 'volume_down',
      action: 'volume_down',
    },
    volume_mute: {
      name: 'volume_mute',
      action: 'volume_mute',
    },
  },
  desktop_lyric: {
    toggle_visible: {
      name: 'toggle_visible',
      action: 'toggle_visible',
    },
    toggle_lock: {
      name: 'toggle_lock',
      action: 'toggle_lock',
    },
    toggle_always_top: {
      name: 'toggle_always_top',
      action: 'toggle_always_top',
    },
  },
}

const keyName = {
  common: names.mainWindow.name,
  player: names.mainWindow.name,
  desktop_lyric: names.winLyric.name,
}

for (const type of Object.keys(hotKey)) {
  let item = hotKey[type]
  for (const key of Object.keys(item)) {
    item[key].action = `${type}_${item[key].action}`
    item[key].name = `${type}_${item[key].name}`
    item[key].type = keyName[type]
  }
}

exports.common = hotKey.common
exports.player = hotKey.player
exports.desktop_lyric = hotKey.desktop_lyric
