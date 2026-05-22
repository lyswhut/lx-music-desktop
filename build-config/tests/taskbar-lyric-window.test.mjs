import test from 'node:test'
import assert from 'node:assert/strict'
import { enableTaskbarLyricIgnoreMouseEvents } from '../../src/main/modules/taskbarLyric/utils.ts'

test('enableTaskbarLyricIgnoreMouseEvents forwards input while ignoring mouse events', () => {
  const calls = []
  const fakeWindow = {
    setIgnoreMouseEvents(ignore, options) {
      calls.push({ ignore, options })
    },
  }

  enableTaskbarLyricIgnoreMouseEvents(fakeWindow)

  assert.deepEqual(calls, [
    {
      ignore: true,
      options: { forward: true },
    },
  ])
})
