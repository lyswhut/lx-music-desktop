import mousetrap from 'mousetrap'

let eventHub

const bindKeys = [
  'shift',
  'mod',
  'mod+a',
]

const bindKey = () => {
  mousetrap.reset()
  for (const key of bindKeys) {
    mousetrap.bind(key, (event, combo) => {
      eventHub.$emit(`key_${key}_down`, { event, combo })
      return false
    }, 'keydown')
    mousetrap.bind(key, (event, combo) => {
      eventHub.$emit(`key_${key}_up`, { event, combo })
      return false
    }, 'keyup')
  }
}

const unbindKey = () => {
  for (const key of bindKeys) {
    mousetrap.unbind(key, 'keydown')
    mousetrap.unbind(key, 'keyup')
  }
}

const handleFocus = () => {
  for (const key of bindKeys) {
    eventHub.$emit(`key_${key}_up`, { combo: key })
  }
}

export default () => {
  eventHub = window.eventHub

  eventHub.$on('bindKey', bindKey)
  eventHub.$on('unbindKey', unbindKey)
  eventHub.$on('focus', handleFocus)
}
