import mousetrap from 'mousetrap'
let eventHub

const bindKey = () => {
  mousetrap.reset()
  mousetrap.bind('shift', (event, combo) => {
    eventHub.$emit('shift_down', { event, combo })
    return false
  }, 'keydown')
  mousetrap.bind('shift', (event, combo) => {
    eventHub.$emit('shift_up', { event, combo })
    return false
  }, 'keyup')
  mousetrap.bind('alt', (event, combo) => {
    eventHub.$emit('alt_down', { event, combo })
    return false
  }, 'keydown')
  mousetrap.bind('alt', (event, combo) => {
    eventHub.$emit('alt_up', { event, combo })
    return false
  }, 'keyup')
  mousetrap.bind('mod+a', (event, combo) => {
    eventHub.$emit('mod+a_down', { event, combo })
    return false
  }, 'keydown')
  mousetrap.bind('mod+a', (event, combo) => {
    eventHub.$emit('mod+a_up', { event, combo })
    return false
  }, 'keyup')
}

const unbindKey = () => {
  mousetrap.unbind('shift', 'keydown')
  mousetrap.unbind('shift', 'keyup')
  mousetrap.unbind('alt', 'keydown')
  mousetrap.unbind('alt', 'keyup')
  mousetrap.unbind('mod+a', 'keydown')
  mousetrap.unbind('mod+a', 'keyup')
}

export default () => {
  eventHub = window.eventHub

  eventHub.$on('bindKey', bindKey)
  eventHub.$on('unbindKey', unbindKey)
}
