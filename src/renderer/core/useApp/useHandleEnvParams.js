import { useAction, useCommit, useRouter } from '@renderer/utils/vueTools'
import { parseUrlParams } from '@renderer/utils'
import { defaultList, loveList, userLists } from '@renderer/core/share/list'
import { getList } from '@renderer/core/share/utils'

const getListPlayIndex = (list, index) => {
  if (index == null) {
    index = 1
  } else {
    index = parseInt(index)
    if (Number.isNaN(index)) {
      index = 1
    } else {
      if (index < 1) index = 1
      else if (index > list.length) index = list.length
    }
  }
  return index - 1
}

const useInitEnvParamSearch = () => {
  const router = useRouter()

  return search => {
    if (search == null) return
    router.push({
      path: 'search',
      query: {
        text: search,
      },
    })
  }
}
const useInitEnvParamPlay = () => {
  const getListDetailAll = useAction('songList', 'getListDetailAll')
  const setPlayList = useCommit('player', 'setList')
  const setTempList = useCommit('player', 'setTempList')

  const playSongListDetail = async(source, link, playIndex) => {
    if (link == null) return
    let list
    let id
    try {
      id = decodeURIComponent(link)
      list = await getListDetailAll({ source, id })
    } catch (err) {
      console.log(err)
    }
    setTempList({
      list,
      index: getListPlayIndex(list, playIndex),
      id: `${source}__${id}`,
    })
  }

  return (playStr) => {
    if (playStr == null || typeof playStr != 'string') return
    // -play="source=kw&link=链接、ID"
    // -play="source=myList&name=名字"
    // -play="source=myList&name=名字&index=位置"
    const params = parseUrlParams(playStr)
    if (params.type != 'songList') return
    switch (params.source) {
      case 'myList':
        if (params.name != null) {
          let targetList
          const lists = [defaultList, loveList, ...userLists]
          for (const list of lists) {
            if (list.name === params.name) {
              targetList = list
              break
            }
          }
          if (!targetList) return

          setPlayList({
            listId: targetList.id,
            index: getListPlayIndex(getList(targetList.id), params.index),
          })
        }
        break
      case 'kw':
      case 'kg':
      case 'tx':
      case 'mg':
      case 'wy':
        playSongListDetail(params.source, params.link, params.index)
        break
    }
  }
}

export default () => {
  // 处理启动参数 search
  const initEnvParamSearch = useInitEnvParamSearch()

  // 处理启动参数 play
  const initEnvParamPlay = useInitEnvParamPlay()

  return envParams => {
    initEnvParamSearch(envParams.search)
    initEnvParamPlay(envParams.play)
  }
}
