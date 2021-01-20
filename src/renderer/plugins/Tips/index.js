import tips from './Tips'
import { debounce } from '../../utils'

let instance
let prevTips

const getTips = el =>
  el
    ? el.getAttribute('tips')
      ? el.getAttribute('tips')
      : el.parentNode === document.documentElement
        ? null
        : getTips(el.parentNode)
    : null

const showTips = debounce(event => {
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
  })
  instance.$on('beforeClose', closeInstance => {
    if (instance !== closeInstance) return
    prevTips = null
    instance = null
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
  if (!instance) return showTips(event)
  setTimeout(() => {
    let msg = getTips(event.target)
    if (!msg || prevTips === msg) return
    setTips(msg)
    prevTips = msg
  })
}

document.body.addEventListener('mousemove', event => {
  hideTips()
  showTips(event)
})

document.body.addEventListener('click', updateTips)

document.body.addEventListener('contextmenu', updateTips)
