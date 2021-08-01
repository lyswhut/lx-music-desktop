const names = {
  base: {
    key_down: 'key_down',
    bindKey: 'bindKey',
    unbindKey: 'unbindKey',
    focus: 'focus',
    min: 'min',
    max: 'max',
    close: 'close',
    set_config: 'set_config',
    set_hot_key_config: 'set_hot_key_config',
  },
  sync: {
    send_action_list: 'send_action_list',
    handle_action_list: 'handle_action_list',
    send_sync_list: 'send_sync_list',
    handle_sync_list: 'handle_sync_list',
  },
}

for (const item of Object.keys(names)) {
  let name = names[item]
  for (const key of Object.keys(name)) {
    name[key] = `${item}_${name[key]}`
  }
}

export const base = names.base
export const sync = names.sync
