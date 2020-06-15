import mousetrap from 'mousetrap'
let eventHub

const bindKey = () => {
  mousetrap.reset()
  mousetrap.bind('shift', (event, combo) => {
    eventHub.$emit('key_shift_down', { event, combo })
    return false
  }, 'keydown')
  mousetrap.bind('shift', (event, combo) => {
    eventHub.$emit('key_shift_up', { event, combo })
    return false
  }, 'keyup')
  mousetrap.bind('mod', (event, combo) => {
    eventHub.$emit('key_mod_down', { event, combo })
    return false
  }, 'keydown')
  mousetrap.bind('mod', (event, combo) => {
    eventHub.$emit('key_mod_up', { event, combo })
    return false
  }, 'keyup')
  mousetrap.bind('mod+a', (event, combo) => {
    eventHub.$emit('key_mod+a_down', { event, combo })
    return false
  }, 'keydown')
  mousetrap.bind('mod+a', (event, combo) => {
    eventHub.$emit('key_mod+a_up', { event, combo })
    return false
  }, 'keyup')
}

const unbindKey = () => {
  mousetrap.unbind('shift', 'keydown')
  mousetrap.unbind('shift', 'keyup')
  mousetrap.unbind('mod', 'keydown')
  mousetrap.unbind('mod', 'keyup')
  mousetrap.unbind('mod+a', 'keydown')
  mousetrap.unbind('mod+a', 'keyup')
}

export default () => {
  eventHub = window.eventHub

  eventHub.$on('bindKey', bindKey)
  eventHub.$on('unbindKey', unbindKey)
}
