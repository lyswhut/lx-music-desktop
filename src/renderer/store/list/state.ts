import { reactive } from '@common/utils/vueTools'

export {
  allMusicList,
  defaultList,
  loveList,
  tempList,
  userLists,
} from '@renderer/store/list/listManage'
// import { reactive, ref, markRaw, Ref } from '@common/utils/vueTools'

// // const TEMP_LIST = 'TEMP_LIST'

// export const isInitedList: Ref<boolean> = ref(false)

// export const allList: Map<string, LX.Music.MusicInfo[]> = window.lxData.allList = markRaw(new Map())

// export const defaultList: Omit<LX.List.MyDefaultListInfo, 'list'> = reactive({
//   id: 'default',
//   name: '试听列表',
// })

// export const loveList: Omit<LX.List.MyLoveListInfo, 'list'> = reactive({
//   id: 'love',
//   name: '我的收藏',
// })

// export const tempList: Omit<LX.List.MyTempListInfo, 'list'> = reactive({
//   id: 'temp',
//   name: '临时列表',
//   meta: {},
// })

export const tempListMeta = {
  id: '',
}


// export const userLists: LX.List.UserListInfo[] = window.lxData.userLists = reactive([])

export const fetchingListStatus = reactive<Record<string, boolean>>({})

export const listUpdateTimes = reactive<Record<string, string>>({})
