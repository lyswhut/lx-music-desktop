// import fs from 'fs'
import path from 'node:path'
import { type WindowSize, windowSizeList } from '@common/config'
import { nativeImage } from 'electron'

export const getWindowSizeInfo = (windowSizeId: number | string): WindowSize => {
  return windowSizeList.find(i => i.id == windowSizeId) ?? windowSizeList[0]
}

const getIconPath = (name: string): Electron.NativeImage => {
  return nativeImage.createFromPath(path.join(global.staticPath, 'images/taskbar', name + '.png'))
}

export const createTaskBarButtons = ({
  empty = false,
  collect = false,
  play = false,
  next = true,
  prev = true,
}: LX.TaskBarButtonFlags, onClick: (action: LX.Player.StatusButtonActions) => void): Electron.ThumbarButton[] => {
  const buttons: Electron.ThumbarButton[] = [
    collect
      ? {
          icon: getIconPath('collected'),
          click() {
            onClick('unCollect')
          },
          tooltip: '取消收藏',
          flags: ['nobackground'],
        }
      : {
          icon: getIconPath('collect'),
          click() {
            onClick('collect')
          },
          tooltip: '收藏',
          flags: ['nobackground'],
        },
    {
      icon: getIconPath('prev'),
      click() {
        onClick('prev')
      },
      tooltip: '上一曲',
      flags: prev ? ['nobackground'] : ['nobackground', 'disabled'],
    },
    play
      ? {
          icon: getIconPath('pause'),
          click() {
            onClick('pause')
          },
          tooltip: '暂停',
          flags: ['nobackground'],
        }
      : {
          icon: getIconPath('play'),
          click() {
            onClick('play')
          },
          tooltip: '播放',
          flags: ['nobackground'],
        },
    {
      icon: getIconPath('next'),
      click() {
        onClick('next')
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
