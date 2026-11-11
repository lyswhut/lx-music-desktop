import { isMiniMode, windowSizeActive } from '@renderer/store'
import { setShowPlayerDetail } from '@renderer/store/player/action'
import { hideWindowTransition, setWindowBoundsTransition } from '@renderer/utils/ipc'
import { nextTick } from '@common/utils/vueTools'

// 迷你窗口可见区域的尺寸（高度 = 上 14px 边距 + 72px 封面 + 下 14px 边距 + 2px 边框）
const MINI_WIDTH = 400
const MINI_HEIGHT = 102

// 迷你窗口距屏幕工作区顶部的距离占工作区高度的比例（约 1/5 处）
const MINI_TOP_RATIO = 0.2

// Chromium 在标准 Screen 上扩展了工作区属性，但 TS 的 DOM 类型定义缺失
const getWorkArea = () => {
  const screen = window.screen as Screen & { availLeft: number, availTop: number, availHeight: number }
  return { availLeft: screen.availLeft, availTop: screen.availTop, availWidth: screen.availWidth, availHeight: screen.availHeight }
}

// 进入迷你模式前记住主窗口的显示状态，退出时原样恢复
let mainWindowMemo: { x: number, y: number, maximized: boolean } | null = null

const isMainWindowMaximized = () => {
  const { availWidth, availHeight } = getWorkArea()
  return window.outerWidth >= availWidth - 10 && window.outerHeight >= availHeight - 10
}

const getCenterPosition = (width: number, height: number) => {
  const { availLeft, availTop, availWidth, availHeight } = getWorkArea()
  return {
    x: Math.round(availLeft + Math.max((availWidth - width) / 2, 0)),
    y: Math.round(availTop + Math.max((availHeight - height) / 2, 0)),
  }
}

/**
 * 切换迷你播放模式
 *
 * 为避免切换过程中出现"迷你窗先移动/缩小再显示主窗体"的中间状态，
 * 采用隐藏窗口 -> 隐藏期间切换布局并调整边界 -> 重新显示的原子切换流程，
 * 用户只会看到窗口以最终形态直接出现。
 * @param val 是否进入迷你模式，不传则切换
 */
export const setMiniMode = async(val?: boolean) => {
  const target = val ?? !isMiniMode.value
  if (target == isMiniMode.value) return

  if (target) {
    // 进入迷你模式前记录主窗口位置与最大化状态
    mainWindowMemo = {
      x: window.screenX,
      y: window.screenY,
      maximized: isMainWindowMaximized(),
    }
  }

  // 第一步：隐藏窗口，等待隐藏完成后再切换布局，避免中间状态被用户看到
  await hideWindowTransition()
  isMiniMode.value = target

  if (target) {
    setShowPlayerDetail(false)
    // 透明模式（非 -dt 启动）下窗口四周有阴影留白，窗口尺寸需要补上
    const offset = window.lx.rootOffset * 2
    // 初始位置：屏幕水平居中、垂直位于上部约 1/5 处
    const { availLeft, availTop, availWidth, availHeight } = getWorkArea()
    // 等待布局切换完成后再以迷你尺寸显示
    await nextTick()
    await setWindowBoundsTransition(MINI_WIDTH + offset, MINI_HEIGHT + offset, {
      x: Math.round(availLeft + (availWidth - MINI_WIDTH) / 2),
      y: Math.round(availTop + availHeight * MINI_TOP_RATIO),
    })
  } else {
    // 退出迷你模式：恢复进入前的位置与显示状态，无记录时才居中
    const width = windowSizeActive.value.width
    const height = windowSizeActive.value.height
    const memo = mainWindowMemo
    mainWindowMemo = null

    // 等待主窗体布局切换完成后再以最终尺寸/位置显示
    await nextTick()
    if (memo?.maximized) {
      await setWindowBoundsTransition(width, height, getCenterPosition(width, height), true)
    } else {
      await setWindowBoundsTransition(width, height, memo ? { x: memo.x, y: memo.y } : getCenterPosition(width, height))
    }
  }
}

export const toggleMiniMode = () => {
  void setMiniMode()
}

/**
 * 初始化迷你模式状态：窗口已经是迷你尺寸（如渲染进程在迷你模式下被刷新/热更新）时，恢复迷你模式，
 * 避免出现一个空白的小窗口
 */
export const initMiniMode = () => {
  const offset = window.lx.rootOffset * 2
  const { innerWidth, innerHeight } = window
  if (Math.abs(innerWidth - (MINI_WIDTH + offset)) <= 2 && Math.abs(innerHeight - (MINI_HEIGHT + offset)) <= 2) {
    isMiniMode.value = true
  }
}
