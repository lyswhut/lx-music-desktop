import type { TaskbarLyricBoundsOptions } from './types'

export const calcTaskbarLyricBounds = ({ display, width, height, position }: TaskbarLyricBoundsOptions): Electron.Rectangle => {
  const safeWidth = Math.max(0, Math.min(Math.round(width), display.width))
  const safeHeight = Math.max(0, Math.min(Math.round(height), display.height))
  const taskbarAtBottom = display.workArea.y + display.workArea.height < display.y + display.height
  const x = position === 'center'
    ? Math.round(display.workArea.x + (display.workArea.width - safeWidth) / 2)
    : Math.round(display.workArea.x + display.workArea.width - safeWidth)
  const y = taskbarAtBottom
    ? Math.round(display.workArea.y + display.workArea.height)
    : Math.round(display.y + display.height - safeHeight)

  return {
    x,
    y,
    width: safeWidth,
    height: safeHeight,
  }
}
