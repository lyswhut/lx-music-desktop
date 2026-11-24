import assert from 'node:assert/strict'

import { resolvePlayModeSelection } from '../../src/renderer/core/player/playMode.mjs'

const run = (name, fn) => {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (err) {
    console.error(`FAIL ${name}`)
    throw err
  }
}

run('switching to random requests random queue reset', () => {
  assert.deepEqual(resolvePlayModeSelection('listLoop', 'random'), {
    nextMode: 'random',
    shouldResetRandomQueue: true,
  })
})

run('clicking random again keeps mode and requests random queue reset', () => {
  assert.deepEqual(resolvePlayModeSelection('random', 'random'), {
    nextMode: 'random',
    shouldResetRandomQueue: true,
  })
})

run('non-random repeated click does nothing special', () => {
  assert.deepEqual(resolvePlayModeSelection('listLoop', 'listLoop'), {
    nextMode: 'listLoop',
    shouldResetRandomQueue: false,
  })
})
