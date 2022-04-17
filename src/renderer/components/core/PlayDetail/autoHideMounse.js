import { debounce } from '@renderer/utils/index'
let isAutoHide = false
let isLockedPointer = false
let dom = null
let event = null
let isMouseDown = false

const isControl = dom => {
  if (!dom || dom === document.body) return false
  // console.log(dom)
  if (dom.getAttribute('aria-label') || dom.tagName == 'BUTTON') return true
  return isControl(dom.parentNode)
}

const lockPointer = () => {
  if (!isAutoHide || isMouseDown) return
  if (event && isControl(document.elementFromPoint(event.clientX, event.clientY))) return

  dom.requestPointerLock()
  isLockedPointer = true
}
const unLockPointer = () => {
  if (!isLockedPointer) return
  document.exitPointerLock()
  isLockedPointer = false
}

const startTimeout = debounce(lockPointer, 3000)

const handleMouseMove = (_event) => {
  event = _event
  startTimeout()
  unLockPointer()
}

const handleMouseDown = () => {
  isMouseDown = true
}
const handleMouseUp = () => {
  isMouseDown = false
  startTimeout()
}

export const registerAutoHideMounse = () => {
  if (isAutoHide) return
  if (!dom) dom = document.getElementById('root')
  isAutoHide = true
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('mouseup', handleMouseUp)
  startTimeout()
}

export const unregisterAutoHideMounse = () => {
  if (!isAutoHide) return
  isAutoHide = false
  // console.log(dom)
  dom.removeEventListener('mousemove', handleMouseMove)
  dom.removeEventListener('mousedown', handleMouseDown)
  dom.removeEventListener('mouseup', handleMouseUp)
  unLockPointer()
}
