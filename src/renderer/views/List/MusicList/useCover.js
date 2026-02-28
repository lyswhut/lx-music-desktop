import { reactive, onBeforeUnmount } from '@common/utils/vueTools'
import { appSetting } from '@renderer/store/setting'
import { getPicUrl as getOnlinePicUrl } from '@renderer/core/music/online'
import { getPicUrl as getLocalPicUrl } from '@renderer/core/music/local'
import placeholderCover from '@renderer/assets/icons/64x64.png' // eslint-disable-line import/no-unresolved

export default () => {
  const isShowCover = appSetting['list.isShowCover']
  const coverSize = appSetting['list.coverSize']

  // 封面缓存映射（使用 reactive 以便跟踪变化）
  const coverUrls = reactive(new Map())
  const fetchingPics = reactive(new Set())
  const loadedCovers = reactive(new Set()) // 已加载完成的封面

  let scrollTimer = null
  let listRefValue = null
  let listValue = null

  const setListRef = (ref) => { listRefValue = ref }
  const setList = (list) => { listValue = list }

  /**
   * 获取封面 URL
   * @param {Object} item - 音乐项
   * @returns {string} 封面 URL 或占位图片
   */
  const getCoverUrl = (item) => {
    if (!isShowCover) return ''
    // 如果封面已加载完成，显示实际封面
    if (loadedCovers.has(item.id)) {
      // 优先使用已缓存的封面
      if (item.meta.picUrl) {
        return item.meta.picUrl
      }
      // 如果已经有缓存的 URL
      if (coverUrls.has(item.id)) {
        return coverUrls.get(item.id)
      }
    }
    // 返回占位图片，等待懒加载
    return placeholderCover
  }

  /**
   * 处理封面加载错误
   * @param {Event} event - 错误事件
   */
  const handleCoverError = (event) => {
    event.target.style.display = 'none'
  }

  /**
   * 处理封面加载完成
   * @param {string} musicId - 音乐ID
   */
  const handleCoverLoad = (musicId) => {
    loadedCovers.add(musicId)
  }

  /**
   * 检查封面是否已加载
   * @param {string} musicId - 音乐ID
   * @returns {boolean} 是否已加载
   */
  const isCoverLoaded = (musicId) => {
    return loadedCovers.has(musicId)
  }

  /**
   * 判断是否使用占位图片（用于决定是否需要过渡效果）
   * @param {Object} item - 音乐项
   * @returns {boolean} 是否使用占位图
   */
  const isUsingPlaceholder = (item) => {
    // 只要封面未加载完成，就使用占位图
    return isShowCover && !loadedCovers.has(item.id)
  }

  /**
   * 获取单个歌曲的封面
   * @param {Object} musicInfo - 音乐信息
   * @param {string} listId - 列表 ID
   */
  const fetchCover = async(musicInfo, listId) => {
    const musicId = musicInfo.id
    if (fetchingPics.has(musicId)) return

    fetchingPics.add(musicId)
    try {
      let picUrl
      // 优先使用已缓存的封面 URL
      if (musicInfo.meta.picUrl) {
        picUrl = musicInfo.meta.picUrl
      } else if (coverUrls.has(musicId)) {
        picUrl = coverUrls.get(musicId)
      } else {
        // 从网络或本地获取
        if (musicInfo.source === 'local') {
          picUrl = await getLocalPicUrl({ musicInfo, listId, isRefresh: false })
        } else {
          picUrl = await getOnlinePicUrl({ musicInfo, listId, isRefresh: false })
        }
      }
      if (picUrl) {
        coverUrls.set(musicId, picUrl)
        // 更新列表中的封面
        if (listValue) {
          const musicItem = listValue.find(m => m.id === musicId)
          if (musicItem) {
            musicItem.meta.picUrl = picUrl
          }
        }
      }
    } catch (err) {
      console.log('Failed to fetch cover:', err)
    } finally {
      fetchingPics.delete(musicId)
    }
  }

  /**
   * 懒加载当前可见区域的封面
   * @param {HTMLElement} domContent - 滚动容器元素
   * @param {number} listItemHeight - 列表项高度
   * @param {string} listId - 列表 ID
   */
  const loadVisibleCovers = (domContent, listItemHeight, listId) => {
    if (!isShowCover || !listRefValue || !listValue) return

    const scrollTop = domContent?.scrollTop ?? 0
    const viewHeight = domContent?.clientHeight ?? 0
    const startIndex = Math.floor(scrollTop / listItemHeight)
    const endIndex = Math.min(listValue.length, Math.ceil((scrollTop + viewHeight) / listItemHeight) + 5)

    // 加载可见区域的封面
    for (let i = startIndex; i < endIndex; i++) {
      const item = listValue[i]
      if (item && !coverUrls.has(item.id) && !fetchingPics.has(item.id)) {
        if (!item.meta.picUrl) {
          fetchCover(item, listId).catch(() => {})
        }
      }
    }
  }

  /**
   * 处理滚动事件（防抖）
   * @param {Event} event - 滚动事件
   * @param {HTMLElement} domContent - 滚动容器元素
   * @param {number} listItemHeight - 列表项高度
   * @param {string} listId - 列表 ID
   */
  const handleScroll = (event, domContent, listItemHeight, listId) => {
    // 防抖处理
    if (scrollTimer) clearTimeout(scrollTimer)
    scrollTimer = setTimeout(() => {
      loadVisibleCovers(domContent, listItemHeight, listId)
    }, 100)
  }

  /**
   * 列表加载完成后加载封面
   * @param {HTMLElement} domContent - 滚动容器元素
   * @param {number} listItemHeight - 列表项高度
   * @param {string} listId - 列表 ID
   */
  const loadCoversOnListLoaded = (domContent, listItemHeight, listId) => {
    if (isShowCover) {
      setTimeout(() => {
        loadVisibleCovers(domContent, listItemHeight, listId)
      }, 100)
    }
  }

  onBeforeUnmount(() => {
    if (scrollTimer) clearTimeout(scrollTimer)
  })

  /**
   * 计算列表项高度（确保能容纳封面）
   * @param {number} baseHeight - 基础行高
   * @returns {number} 调整后的行高
   */
  const getListItemHeight = (baseHeight) => {
    if (!isShowCover) return baseHeight
    // 封面高度 + 上下内边距（各 8px）
    const minHeight = coverSize + 16
    return Math.max(baseHeight, minHeight)
  }

  return {
    isShowCover,
    coverSize,
    getCoverUrl,
    handleCoverError,
    handleCoverLoad,
    isCoverLoaded,
    isUsingPlaceholder,
    handleScroll,
    loadCoversOnListLoaded,
    setListRef,
    setList,
    getListItemHeight,
  }
}
