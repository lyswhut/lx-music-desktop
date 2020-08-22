const { player: hotKeyPlayer, common: hotKeyCommon, desktop_lyric: hotKeyDesktopLyric } = require('./hotKey')

module.exports = {
  local: {
    enable: true,
    keys: {
      'mod+f5': {
        type: hotKeyPlayer.toggle_play.type,
        name: hotKeyPlayer.toggle_play.name,
        action: hotKeyPlayer.toggle_play.action,
      },
      'mod+arrowleft': {
        type: hotKeyPlayer.prev.type,
        name: hotKeyPlayer.prev.name,
        action: hotKeyPlayer.prev.action,
      },
      'mod+arrowright': {
        type: hotKeyPlayer.next.type,
        name: hotKeyPlayer.next.name,
        action: hotKeyPlayer.next.action,
      },
      f1: {
        type: hotKeyCommon.focusSearchInput.type,
        name: hotKeyCommon.focusSearchInput.name,
        action: hotKeyCommon.focusSearchInput.action,
      },
    },
  },
  global: {
    enable: false,
    keys: {
      MediaPlayPause: {
        type: hotKeyPlayer.toggle_play.type,
        name: null,
        action: hotKeyPlayer.toggle_play.action,
      },
      MediaPreviousTrack: {
        type: hotKeyPlayer.prev.type,
        name: null,
        action: hotKeyPlayer.prev.action,
      },
      MediaNextTrack: {
        type: hotKeyPlayer.next.type,
        name: null,
        action: hotKeyPlayer.next.action,
      },
      'mod+alt+f5': {
        type: hotKeyPlayer.toggle_play.type,
        name: hotKeyPlayer.toggle_play.name,
        action: hotKeyPlayer.toggle_play.action,
      },
      'mod+alt+arrowleft': {
        type: hotKeyPlayer.prev.type,
        name: hotKeyPlayer.prev.name,
        action: hotKeyPlayer.prev.action,
      },
      'mod+alt+arrowright': {
        type: hotKeyPlayer.next.type,
        name: hotKeyPlayer.next.name,
        action: hotKeyPlayer.next.action,
      },
      'mod+alt+arrowup': {
        type: hotKeyPlayer.volume_up.type,
        name: hotKeyPlayer.volume_up.name,
        action: hotKeyPlayer.volume_up.action,
      },
      'mod+alt+arrowdown': {
        type: hotKeyPlayer.volume_down.type,
        name: hotKeyPlayer.volume_down.name,
        action: hotKeyPlayer.volume_down.action,
      },
      'mod+alt+0': {
        type: hotKeyDesktopLyric.toggle_visible.type,
        name: hotKeyDesktopLyric.toggle_visible.name,
        action: hotKeyDesktopLyric.toggle_visible.action,
      },
      'mod+alt+-': {
        type: hotKeyDesktopLyric.toggle_lock.type,
        name: hotKeyDesktopLyric.toggle_lock.name,
        action: hotKeyDesktopLyric.toggle_lock.action,
      },
      'mod+alt+=': {
        type: hotKeyDesktopLyric.toggle_always_top.type,
        name: hotKeyDesktopLyric.toggle_always_top.name,
        action: hotKeyDesktopLyric.toggle_always_top.action,
      },
    },
  },
}
