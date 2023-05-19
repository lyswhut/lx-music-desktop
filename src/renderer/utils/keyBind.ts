import { isMac } from '@common/utils'

const downKeys = new Set<string>()

export type KeyActionType = LX.KeyDownEevent['type']
export type Keys = LX.KeyDownEevent['keys']
export type Key = LX.KeyDownEevent['key']
export type EventKey = LX.KeyDownEevent['eventKey']
export type Event = LX.KeyDownEevent['event']

const handleEvent = (type: KeyActionType, event: LX.KeyEvent, keys: Keys, isEditing: boolean) => {
  let eventKey = event.key
  if (isMac) {
    let index = keys.indexOf('meta')
    if (index > -1) keys.splice(index, 1, 'mod')
    if (eventKey == 'Meta') eventKey = 'mod'
  } else {
    let index = keys.indexOf('ctrl')
    if (index > -1) keys.splice(index, 1, 'mod')
    if (eventKey == 'Control') eventKey = 'mod'
  }
  let key = keys.join('+')

  switch (type) {
    case 'down':
      downKeys.add(key)
      break
    case 'up':
      downKeys.delete(key)
      break
  }
  handleSendEvent(key, eventKey, type, event, keys, isEditing)
}

// 修饰键处理
const eventModifiers = (event: LX.KeyEvent): string[] => {
  let modifiers: string[] = []
  if (event.ctrlKey) modifiers.push('ctrl')
  if (event.shiftKey) modifiers.push('shift')
  if (event.altKey) modifiers.push('alt')
  if (event.metaKey) modifiers.push('meta')

  return modifiers
}

// 是否忽略事件（表单元素等默认忽略）
const assertStopCallback = (element: HTMLElement) => {
  // if the element has the class "keybind" then no need to stop
  if (element.classList.contains('key-bind')) return false

  // stop for input, select, and textarea
  switch (element.tagName) {
    case 'INPUT':
    case 'SELECT':
    case 'TEXTAREA':
      return true
    default:
      return !!element.isContentEditable
  }
}

const handleKeyDown = (event: LX.KeyEvent) => {
  // if (assertStopCallback(event.target)) return
  // event.preventDefault()
  let keys = eventModifiers(event)
  switch (event.key) {
    case 'Control':
    case 'Alt':
    case 'Meta':
    case 'Shift':
      break
    case ' ':
      keys.push('space')
      break
    default:
      keys.push((event.code.includes('Numpad') ? event.code.replace(/^Numpad(\w{1,3})\w*$/i, 'num$1') : event.key).toLowerCase())
      break
  }
  handleEvent('down', event, keys, event.target ? assertStopCallback(event.target as HTMLElement) : false)
}

const handleKeyUp = (event: LX.KeyEvent) => {
  // if (assertStopCallback(event.target)) return
  event.preventDefault()
  let keys = eventModifiers(event)
  switch (event.key) {
    case 'Control':
      keys.push('ctrl')
      break
    case ' ':
      keys.push('space')
      break
    default:
      keys.push((event.code.includes('Numpad') ? event.code.replace(/^Numpad(\w{1,3})\w*$/i, 'num$1') : event.key).toLowerCase())
      break
  }
  handleEvent('up', event, keys, event.target ? assertStopCallback(event.target as HTMLElement) : false)
}

type HandleSendEvent = (key: Key, eventKey: EventKey, type: KeyActionType, event: Event, keys: Keys, isEditing: boolean) => void
let handleSendEvent: HandleSendEvent

const bindKey = (handle: HandleSendEvent = () => {}) => {
  handleSendEvent = handle
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
}

const unbindKey = () => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
}

const clearDownKeys = () => {
  let keys = Array.from(downKeys)
  for (let i = keys.length - 1; i > -1; i--) {
    handleSendEvent(keys[i], keys[i], 'up', null, [keys[i]], false)
  }
  downKeys.clear()
}

export default {
  bindKey,
  unbindKey,
  clearDownKeys,
}
