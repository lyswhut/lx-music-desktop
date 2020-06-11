const names = {
  base: {
    bindKey: 'bindKey',
    unbindKey: 'unbindKey',
    focus: 'focus',
    min: 'min',
    max: 'max',
    close: 'close',
    set_config: 'set_config',
  },
}

for (const item of Object.keys(names)) {
  let name = names[item]
  for (const key of Object.keys(name)) {
    name[key] = `${item}_${name[key]}`
  }
}

export const base = names.base
