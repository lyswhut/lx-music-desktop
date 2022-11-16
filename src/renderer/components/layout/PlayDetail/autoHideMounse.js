import { debounce } from '@common/utils/common'
let isAutoHide = false
let isLockedPointer = false
// let dom = null
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

  document.body.requestPointerLock()
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
  // if (!dom) dom = document.getElementById('root')
  isAutoHide = true
  document.body.addEventListener('mousemove', handleMouseMove)
  document.body.addEventListener('mousedown', handleMouseDown)
  document.body.addEventListener('mouseup', handleMouseUp)
  startTimeout()
}

export const unregisterAutoHideMounse = () => {
  if (!isAutoHide) return
  isAutoHide = false
  // console.log(dom)
  document.body.removeEventListener('mousemove', handleMouseMove)
  document.body.removeEventListener('mousedown', handleMouseDown)
  document.body.removeEventListener('mouseup', handleMouseUp)
  unLockPointer()
}
