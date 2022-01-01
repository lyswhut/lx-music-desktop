import { reactive, ref, markRaw } from '@renderer/utils/vueTools'

// const TEMP_LIST = 'TEMP_LIST'

export const isInitedList = ref(false)

export const setInited = () => {
  isInitedList.value = true
}

export const allList = window.allList = markRaw({})

export const allListInit = (newLists) => {
  const newIds = [defaultList.id, loveList.id, tempList.id, ...newLists.userList.map(l => l.id)]
  for (const id of Object.keys(allList)) {
    if (newIds.includes(id)) continue
    delete allList[id]
  }
  allListUpdate(defaultList.id, newLists.defaultList.list)
  allListUpdate(loveList.id, newLists.loveList.list)
  if (newLists.tempList) allListUpdate(tempList.id, newLists.tempList.list)
  userLists.splice(0, userLists.length)
  for (const { list, ...listInfo } of newLists.userList) {
    allListUpdate(listInfo.id, list)
    userLists.push(listInfo)
  }
}
export const allListUpdate = (id, list) => {
  if (allList[id]) {
    allList[id].splice(0, allList[id].length, ...list)
  } else {
    allList[id] = reactive(list)
  }
}
export const allListRemove = id => {
  delete allList[id]
}

export const defaultList = reactive({
  id: 'default',
  name: '试听列表',
})

export const loveList = reactive({
  id: 'love',
  name: '我的收藏',
})

export const tempList = reactive({
  id: 'temp',
  name: '临时列表',
  meta: {},
})

export const userLists = window.userLists = reactive([])

export const addUserList = ({
  name,
  id,
  list,
  source,
  sourceListId,
  position,
  locationUpdateTime,
}) => {
  if (position == null) {
    userLists.push({
      name,
      id,
      source,
      sourceListId,
      locationUpdateTime,
    })
  } else {
    userLists.splice(position + 1, 0, {
      name,
      id,
      source,
      sourceListId,
      locationUpdateTime,
    })
  }
  allListUpdate(id, list)
}

export const updateList = ({
  name,
  id,
  list,
  source,
  sourceListId,
  meta,
  locationUpdateTime,
}) => {
  let targetList
  switch (id) {
    case defaultList.id:
    case loveList.id:
      break
    case tempList.id:
      tempList.meta = meta || {}
      break
    default:
      targetList = userLists.find(l => l.id == id)
      targetList.name = name
      targetList.source = source
      targetList.sourceListId = sourceListId
      if (locationUpdateTime) targetList.locationUpdateTime = locationUpdateTime
      break
  }
  allListUpdate(id, list)
}

export const removeUserList = id => {
  const index = userLists.findIndex(l => l.id == id)
  if (index < 0) return
  userLists.splice(index, 1)
  allListRemove(id)
}

export const getList = id => {
  return allList[id] ?? []
}
