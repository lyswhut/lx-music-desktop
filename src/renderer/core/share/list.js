import { reactive, ref, markRaw } from '@renderer/utils/vueTools'

// const TEMP_LIST = 'TEMP_LIST'

export const isInitedList = ref(false)

export const setInited = () => {
  isInitedList.value = true
}

export const allList = markRaw({})

export const allListInit = (defaultList, loveList, tempList, userList) => {
  for (const id of Object.keys(allList)) {
    delete allList[id]
  }
  allList[defaultList.id] = reactive(defaultList.list)
  allList[loveList.id] = reactive(loveList.list)
  allList[tempList.id] = reactive(tempList.list)
  userLists.splice(0, userLists.length)
  for (const { list, ...listInfo } of userList) {
    allList[listInfo.id] = reactive(list)
    userLists.push(listInfo)
  }
}
export const allListUpdate = (id, list) => {
  if (allList[id]) {
    allList[id].splice(0, allList[id].length, ...list)
  } else {
    allList[id] = list
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
})

export const userLists = reactive([])

export const addUserList = ({
  name,
  id,
  list,
  source,
  sourceListId,
  position,
}) => {
  if (position == null) {
    userLists.push({
      name,
      id,
      source,
      sourceListId,
    })
  } else {
    userLists.splice(position + 1, 0, {
      name,
      id,
      source,
      sourceListId,
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
}) => {
  let targetList
  switch (id) {
    case defaultList.id:
    case loveList.id:
    case tempList.id:
      break
    default:
      targetList = userLists.find(l => l.id == id)
      targetList.name = name
      targetList.source = source
      targetList.sourceListId = sourceListId
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
