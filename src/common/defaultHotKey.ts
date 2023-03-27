import { HOTKEY_PLAYER, HOTKEY_COMMON, HOTKEY_DESKTOP_LYRIC } from './hotKey'

const local: LX.HotKeyConfig = {
  enable: true,
  keys: {
    'mod+f5': {
      type: HOTKEY_PLAYER.toggle_play.type,
      name: HOTKEY_PLAYER.toggle_play.name,
      action: HOTKEY_PLAYER.toggle_play.action,
    },
    'mod+arrowleft': {
      type: HOTKEY_PLAYER.prev.type,
      name: HOTKEY_PLAYER.prev.name,
      action: HOTKEY_PLAYER.prev.action,
    },
    'mod+arrowright': {
      type: HOTKEY_PLAYER.next.type,
      name: HOTKEY_PLAYER.next.name,
      action: HOTKEY_PLAYER.next.action,
    },
    f1: {
      type: HOTKEY_COMMON.focusSearchInput.type,
      name: HOTKEY_COMMON.focusSearchInput.name,
      action: HOTKEY_COMMON.focusSearchInput.action,
    },
  },
}

const global: LX.HotKeyConfig = {
  enable: false,
  keys: {
    // MediaPlayPause: {
    //   type: HOTKEY_PLAYER.toggle_play.type,
    //   name: '',
    //   action: HOTKEY_PLAYER.toggle_play.action,
    // },
    // MediaPreviousTrack: {
    //   type: HOTKEY_PLAYER.prev.type,
    //   name: '',
    //   action: HOTKEY_PLAYER.prev.action,
    // },
    // MediaNextTrack: {
    //   type: HOTKEY_PLAYER.next.type,
    //   name: '',
    //   action: HOTKEY_PLAYER.next.action,
    // },
    'mod+alt+f5': {
      type: HOTKEY_PLAYER.toggle_play.type,
      name: HOTKEY_PLAYER.toggle_play.name,
      action: HOTKEY_PLAYER.toggle_play.action,
    },
    'mod+alt+arrowleft': {
      type: HOTKEY_PLAYER.prev.type,
      name: HOTKEY_PLAYER.prev.name,
      action: HOTKEY_PLAYER.prev.action,
    },
    'mod+alt+arrowright': {
      type: HOTKEY_PLAYER.next.type,
      name: HOTKEY_PLAYER.next.name,
      action: HOTKEY_PLAYER.next.action,
    },
    'mod+alt+arrowup': {
      type: HOTKEY_PLAYER.volume_up.type,
      name: HOTKEY_PLAYER.volume_up.name,
      action: HOTKEY_PLAYER.volume_up.action,
    },
    'mod+alt+arrowdown': {
      type: HOTKEY_PLAYER.volume_down.type,
      name: HOTKEY_PLAYER.volume_down.name,
      action: HOTKEY_PLAYER.volume_down.action,
    },
    'mod+alt+0': {
      type: HOTKEY_DESKTOP_LYRIC.toggle_visible.type,
      name: HOTKEY_DESKTOP_LYRIC.toggle_visible.name,
      action: HOTKEY_DESKTOP_LYRIC.toggle_visible.action,
    },
    'mod+alt+-': {
      type: HOTKEY_DESKTOP_LYRIC.toggle_lock.type,
      name: HOTKEY_DESKTOP_LYRIC.toggle_lock.name,
      action: HOTKEY_DESKTOP_LYRIC.toggle_lock.action,
    },
    'mod+alt+=': {
      type: HOTKEY_DESKTOP_LYRIC.toggle_always_top.type,
      name: HOTKEY_DESKTOP_LYRIC.toggle_always_top.name,
      action: HOTKEY_DESKTOP_LYRIC.toggle_always_top.action,
    },
  },
}

export default {
  local,
  global,
}
