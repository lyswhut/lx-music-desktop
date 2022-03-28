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
const startTimeout = debounce(() => {
  if (!isAutoHide || isMouseDown || !event) return
  if (isControl(document.elementFromPoint(event.clientX, event.clientY))) return

  dom.requestPointerLock()
  isLockedPointer = true
}, 3000)

const handleMouseMove = (_event) => {
  event = _event
  startTimeout()
  if (!isLockedPointer) return
  document.exitPointerLock()
  isLockedPointer = false
}

const handleMouseDown = () => {
  isMouseDown = true
}
const handleMouseUp = () => {
  isMouseDown = false
  startTimeout()
}

export const registerAutoHideMounse = _dom => {
  startTimeout()
  if (isAutoHide || !_dom) return
  isAutoHide = true
  _dom.addEventListener('mousemove', handleMouseMove)
  _dom.addEventListener('mousedown', handleMouseDown)
  _dom.addEventListener('mouseup', handleMouseUp)
  dom = _dom
}

export const unregisterAutoHideMounse = dom => {
  if (!isAutoHide) return
  isAutoHide = false
  // console.log(dom)
  dom?.removeEventListener('mousemove', handleMouseMove)
  dom?.removeEventListener('mousedown', handleMouseDown)
  dom?.removeEventListener('mouseup', handleMouseUp)
}
