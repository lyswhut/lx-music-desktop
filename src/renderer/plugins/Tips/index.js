import tips from './Tips'
import { debounce } from '../../utils'
import { base as eventBaseName } from '@renderer/event/names'

let instance
let prevTips
let prevX = 0
let prevY = 0
let isDraging = false

const getTips = el =>
  el
    ? el.getAttribute('tips')
      ? el.getAttribute('tips')
      : el.parentNode === document.documentElement
        ? null
        : getTips(el.parentNode)
    : null

const showTips = debounce(event => {
  if (isDraging) return
  let msg = getTips(event.target)
  if (!msg) return
  prevTips = msg
  instance = tips({
    message: msg,
    autoCloseTime: 10000,
    position: {
      top: event.y + 12,
      left: event.x + 8,
    },
  }, {
    beforeClose(closeInstance) {
      if (instance !== closeInstance) return
      prevTips = null
      instance = null
    },
  })
}, 400)

const hideTips = () => {
  if (!instance) return
  instance.cancel()
}

const setTips = tips => {
  if (!instance) return
  instance.setTips(tips)
}

const updateTips = event => {
  if (isDraging) return
  if (!instance) return showTips(event)
  setTimeout(() => {
    let msg = getTips(event.target)
    if (!msg || prevTips === msg) return
    setTips(msg)
    prevTips = msg
  })
}

document.body.addEventListener('mousemove', event => {
  if ((event.x == prevX && event.y == prevY) || isDraging) return
  prevX = event.x
  prevY = event.y
  hideTips()
  showTips(event)
})

document.body.addEventListener('click', updateTips)

document.body.addEventListener('contextmenu', updateTips)

window.eventHub.on(eventBaseName.focus, () => {
  hideTips()
})
window.eventHub.on(eventBaseName.dragStart, () => {
  isDraging = true
  hideTips()
})
window.eventHub.on(eventBaseName.dragEnd, () => {
  isDraging = false
})
