const path = require('path')
const Event = require('./event/event')
const eventNames = require('./event/name')

exports.Event = Event
exports.eventNames = eventNames

exports.setThumbnailClip = (region = { x: 0, y: 0, width: 0, height: 0 }) => {
  if (!global.modules.mainWindow) return
  return global.modules.mainWindow.setThumbnailClip(region)
}

const getIconPath = name => {
  return path.join(global.__static, 'images/taskbar', name + '.png')
}

const buttonsFlags = {
  empty: true,
  collect: false,
  play: false,
  next: true,
  prev: true,
}
const createButtons = ({ empty = false, collect = false, play = false, next = true, prev = true }) => {
  const buttons = [
    collect
      ? {
          icon: getIconPath('collected'),
          click() {
            global.lx_event.taskbar.thumbarButtonClick('unCollect')
          },
          tooltip: '取消收藏',
          flags: ['nobackground'],
        }
      : {
          icon: getIconPath('collect'),
          click() {
            global.lx_event.taskbar.thumbarButtonClick('collect')
          },
          tooltip: '收藏',
          flags: ['nobackground'],
        },
    {
      icon: getIconPath('prev'),
      click() {
        global.lx_event.taskbar.thumbarButtonClick('prev')
      },
      tooltip: '上一曲',
      flags: prev ? ['nobackground'] : ['nobackground', 'disabled'],
    },
    play
      ? {
          icon: getIconPath('pause'),
          click() {
            global.lx_event.taskbar.thumbarButtonClick('pause')
          },
          tooltip: '暂停',
          flags: ['nobackground'],
        }
      : {
          icon: getIconPath('play'),
          click() {
            global.lx_event.taskbar.thumbarButtonClick('play')
          },
          tooltip: '播放',
          flags: ['nobackground'],
        },
    {
      icon: getIconPath('next'),
      click() {
        global.lx_event.taskbar.thumbarButtonClick('next')
      },
      tooltip: '下一曲',
      flags: next ? ['nobackground'] : ['nobackground', 'disabled'],
    },
  ]
  if (empty) {
    for (const button of buttons) {
      button.flags = ['nobackground', 'disabled']
    }
  }
  return buttons
}
exports.setThumbarButtons = ({ empty, collect, play, next, prev } = buttonsFlags) => {
  if (!global.modules.mainWindow) return
  buttonsFlags.empty = empty
  buttonsFlags.collect = collect
  buttonsFlags.play = play
  buttonsFlags.next = next
  buttonsFlags.prev = prev
  global.modules.mainWindow.setThumbarButtons(createButtons(buttonsFlags))
}
