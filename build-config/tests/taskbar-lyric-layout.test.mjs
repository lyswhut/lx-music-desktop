import test from 'node:test'
import assert from 'node:assert/strict'
import { calcTaskbarLyricBounds } from '../../src/main/modules/taskbarLyric/utils.ts'

test('calcTaskbarLyricBounds anchors to bottom-right by default', () => {
  const bounds = calcTaskbarLyricBounds({
    display: {
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      workArea: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1040,
      },
    },
    width: 360,
    height: 56,
    position: 'right',
  })

  assert.equal(bounds.x, 1560)
  assert.equal(bounds.y, 1040)
  assert.equal(bounds.width, 360)
  assert.equal(bounds.height, 56)
})

test('calcTaskbarLyricBounds centers the bar on the bottom taskbar', () => {
  const bounds = calcTaskbarLyricBounds({
    display: {
      x: 100,
      y: 50,
      width: 1600,
      height: 920,
      workArea: {
        x: 100,
        y: 50,
        width: 1600,
        height: 860,
      },
    },
    width: 400,
    height: 60,
    position: 'center',
  })

  assert.equal(bounds.x, 700)
  assert.equal(bounds.y, 910)
  assert.equal(bounds.width, 400)
  assert.equal(bounds.height, 60)
})
