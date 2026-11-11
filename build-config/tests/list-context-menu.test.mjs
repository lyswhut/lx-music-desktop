import assert from 'node:assert/strict'

import { shouldCopyListTextOnContextMenu } from '../../src/renderer/utils/listContextMenu.mjs'

const run = (name, fn) => {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

run('does not hijack row menu when right-clicking selectable text without an active selection', () => {
  assert.equal(shouldCopyListTextOnContextMenu({
    isSelectTextTarget: true,
    selectionText: '',
  }), false)
})

run('keeps text copy behavior when right-clicking selected text', () => {
  assert.equal(shouldCopyListTextOnContextMenu({
    isSelectTextTarget: true,
    selectionText: 'Song Name',
  }), true)
})

run('ignores non-select targets', () => {
  assert.equal(shouldCopyListTextOnContextMenu({
    isSelectTextTarget: false,
    selectionText: 'Song Name',
  }), false)
})
