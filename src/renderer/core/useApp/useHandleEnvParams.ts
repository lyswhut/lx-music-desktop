// import { useRouter } from '@common/utils/vueTools'
// import { parseUrlParams } from '@common/utils/renderer'
// import { defaultList, loveList, userLists } from '@renderer/store/list'
// import { getList } from '@renderer/store/utils'
// import usePlaySonglist from './compositions/usePlaySonglist'
// import { setPlayList } from '@renderer/store/player'

// const getListPlayIndex = (list: LX.Music.MusicInfo[], indexStr?: string): number => {
//   let index: number
//   if (indexStr == null) {
//     index = 1
//   } else {
//     index = parseInt(indexStr)
//     if (Number.isNaN(index)) {
//       index = 1
//     } else {
//       if (index < 1) index = 1
//       else if (index > list.length) index = list.length
//     }
//   }
//   return index - 1
// }

// const useInitEnvParamSearch = () => {
//   const router = useRouter()

//   return (search?: string) => {
//     if (search == null) return
//     void router.push({
//       path: 'search',
//       query: {
//         text: search,
//       },
//     })
//   }
// }
// const useInitEnvParamPlay = () => {
//   // const setPlayList = useCommit('player', 'setList')

//   const playSongListDetail = usePlaySonglist()

//   return (playStr?: string) => {
//     if (playStr == null || typeof playStr != 'string') return
//     // -play="source=kw&link=链接、ID"
//     // -play="source=myList&name=名字"
//     // -play="source=myList&name=名字&index=位置"
//     const params = parseUrlParams(playStr)
//     if (params.type != 'songList') return
//     switch (params.source) {
//       case 'myList':
//         if (params.name != null) {
//           let targetList
//           const lists = [defaultList, loveList, ...userLists]
//           for (const list of lists) {
//             if (list.name === params.name) {
//               targetList = list
//               break
//             }
//           }
//           if (!targetList) return

//           setPlayList({
//             listId: targetList.id,
//             index: getListPlayIndex(getList(targetList.id), params.index),
//           })
//         }
//         break
//       case 'kw':
//       case 'kg':
//       case 'tx':
//       case 'mg':
//       case 'wy':
//         playSongListDetail(params.source, params.link, params.index)
//         break
//     }
//   }
// }

// export default () => {
//   // 处理启动参数 search
//   const initEnvParamSearch = useInitEnvParamSearch()

//   // 处理启动参数 play
//   const initEnvParamPlay = useInitEnvParamPlay()

//   return (envParams: LX.EnvParams) => {
//     initEnvParamSearch(envParams.cmdParams.search)
//     initEnvParamPlay(envParams.cmdParams.play)
//   }
// }
