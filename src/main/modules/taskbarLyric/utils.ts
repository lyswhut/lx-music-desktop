import type { TaskbarLyricBoundsOptions } from './types'

const getTaskbarPosition = ({ display }: Pick<TaskbarLyricBoundsOptions, 'display'>) => {
  if (display.workArea.x > display.x) return 'left'
  if (display.workArea.y > display.y) return 'top'
  if (display.workArea.x + display.workArea.width < display.x + display.width) return 'right'
  if (display.workArea.y + display.workArea.height < display.y + display.height) return 'bottom'
  return 'bottom'
}

export const calcTaskbarLyricBounds = ({ display, width, height, position }: TaskbarLyricBoundsOptions): Electron.Rectangle => {
  const safeWidth = Math.max(0, Math.min(Math.round(width), display.width))
  const safeHeight = Math.max(0, Math.min(Math.round(height), display.height))
  const taskbarPosition = getTaskbarPosition({ display })
  const horizontalX = position === 'center'
    ? Math.round(display.workArea.x + (display.workArea.width - safeWidth) / 2)
    : Math.round(display.workArea.x + display.workArea.width - safeWidth)
  const verticalY = position === 'center'
    ? Math.round(display.workArea.y + (display.workArea.height - safeHeight) / 2)
    : Math.round(display.workArea.y + display.workArea.height - safeHeight)
  let x: number
  let y: number

  switch (taskbarPosition) {
    case 'top':
      x = horizontalX
      y = display.y
      break
    case 'left':
      x = display.x
      y = verticalY
      break
    case 'right':
      x = display.workArea.x + display.workArea.width
      y = verticalY
      break
    case 'bottom':
    default:
      x = horizontalX
      y = display.workArea.y + display.workArea.height
      break
  }

  return {
    x,
    y,
    width: safeWidth,
    height: safeHeight,
  }
}
