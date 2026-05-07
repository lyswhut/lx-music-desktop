import assert from 'node:assert/strict'

import {
  buildPlayQueueSections,
  moveTempQueueItem,
} from '../../src/renderer/core/player/queue.mjs'

const createMusic = (id, name) => ({
  id,
  name,
  singer: `${name} singer`,
  source: 'kw',
  interval: '03:00',
  meta: {
    albumName: `${name} album`,
  },
})

const run = (name, fn) => {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

run('buildPlayQueueSections creates temp and base sections with active item metadata', () => {
  const tempPlayList = [
    { listId: 'list_a', musicInfo: createMusic('temp_1', 'Temp 1'), isTempPlay: true },
    { listId: 'list_b', musicInfo: createMusic('temp_2', 'Temp 2'), isTempPlay: true },
  ]
  const baseList = [
    createMusic('song_1', 'Song 1'),
    createMusic('song_2', 'Song 2'),
  ]

  const sections = buildPlayQueueSections({
    tempPlayList,
    baseList,
    baseListId: 'list_a',
    playMusicInfo: {
      listId: 'list_b',
      musicInfo: tempPlayList[1].musicInfo,
      isTempPlay: true,
    },
  })

  assert.equal(sections.length, 2)
  assert.deepEqual(sections.map(section => section.key), ['temp', 'base'])
  assert.equal(sections[0].items[1].isActive, true)
  assert.equal(sections[0].items[1].canRemove, true)
  assert.equal(sections[0].items[1].canDrag, true)
  assert.equal(sections[1].items[0].canRemove, false)
  assert.equal(sections[1].items[0].canDrag, false)
  assert.equal(sections[1].items[0].isActive, false)
})

run('moveTempQueueItem reorders temp queue immutably', () => {
  const tempPlayList = [
    { listId: 'list_a', musicInfo: createMusic('temp_1', 'Temp 1'), isTempPlay: true },
    { listId: 'list_b', musicInfo: createMusic('temp_2', 'Temp 2'), isTempPlay: true },
    { listId: 'list_c', musicInfo: createMusic('temp_3', 'Temp 3'), isTempPlay: true },
  ]

  const movedList = moveTempQueueItem(tempPlayList, 2, 0)

  assert.deepEqual(movedList.map(item => item.musicInfo.id), ['temp_3', 'temp_1', 'temp_2'])
  assert.deepEqual(tempPlayList.map(item => item.musicInfo.id), ['temp_1', 'temp_2', 'temp_3'])
})
