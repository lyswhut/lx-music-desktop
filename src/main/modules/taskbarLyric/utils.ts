import type { TaskbarLyricBoundsOptions, TaskbarPosition } from './types'

const getTaskbarRect = ({ display }: Pick<TaskbarLyricBoundsOptions, 'display'>): Electron.Rectangle | null => {
  if (display.workArea.x > display.x) {
    return {
      x: display.x,
      y: display.y,
      width: display.workArea.x - display.x,
      height: display.height,
    }
  }

  if (display.workArea.y > display.y) {
    return {
      x: display.x,
      y: display.y,
      width: display.width,
      height: display.workArea.y - display.y,
    }
  }

  const taskbarRight = display.workArea.x + display.workArea.width
  const displayRight = display.x + display.width
  if (taskbarRight < displayRight) {
    return {
      x: taskbarRight,
      y: display.y,
      width: displayRight - taskbarRight,
      height: display.height,
    }
  }

  const taskbarBottom = display.workArea.y + display.workArea.height
  const displayBottom = display.y + display.height
  if (taskbarBottom < displayBottom) {
    return {
      x: display.x,
      y: taskbarBottom,
      width: display.width,
      height: displayBottom - taskbarBottom,
    }
  }

  return null
}

const getTaskbarPosition = ({ display }: Pick<TaskbarLyricBoundsOptions, 'display'>): TaskbarPosition | null => {
  if (display.workArea.x > display.x) return 'left'
  if (display.workArea.y > display.y) return 'top'
  if (display.workArea.x + display.workArea.width < display.x + display.width) return 'right'
  if (display.workArea.y + display.workArea.height < display.y + display.height) return 'bottom'
  return null
}

export const calcTaskbarLyricBounds = ({ display, width, height, position }: TaskbarLyricBoundsOptions): Electron.Rectangle => {
  const taskbarPosition = getTaskbarPosition({ display })
  const taskbarRect = getTaskbarRect({ display })

  const safeWidth = Math.max(0, Math.min(Math.round(width), taskbarRect?.width ?? display.width))
  const safeHeight = Math.max(0, Math.min(Math.round(height), taskbarRect?.height ?? display.height))
  const horizontalX = position === 'center'
    ? Math.round((taskbarRect?.x ?? display.workArea.x) + ((taskbarRect?.width ?? display.workArea.width) - safeWidth) / 2)
    : Math.round((taskbarRect?.x ?? display.workArea.x) + (taskbarRect?.width ?? display.workArea.width) - safeWidth)
  const verticalY = position === 'center'
    ? Math.round((taskbarRect?.y ?? display.workArea.y) + ((taskbarRect?.height ?? display.workArea.height) - safeHeight) / 2)
    : Math.round((taskbarRect?.y ?? display.workArea.y) + (taskbarRect?.height ?? display.workArea.height) - safeHeight)

  if (taskbarPosition == null) {
    return {
      x: Math.round(display.workArea.x + display.workArea.width - safeWidth),
      y: Math.max(display.workArea.y, display.workArea.y + display.workArea.height - safeHeight),
      width: safeWidth,
      height: safeHeight,
    }
  }

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
      x = (taskbarRect?.x ?? display.workArea.x) + (taskbarRect?.width ?? 0) - safeWidth
      y = verticalY
      break
    case 'bottom':
    default:
      x = horizontalX
      y = (taskbarRect?.y ?? display.workArea.y) + (taskbarRect?.height ?? 0) - safeHeight
      break
  }

  return {
    x,
    y,
    width: safeWidth,
    height: safeHeight,
  }
}
