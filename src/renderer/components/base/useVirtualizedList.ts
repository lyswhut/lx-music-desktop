// import {
//   computed,
//   ref,
//   nextTick,
//   watch,
//   onMounted,
//   onBeforeUnmount,
// } from 'vue'
// import { scrollTo } from '@common/utils/renderer'

// interface ListItem {
//   item: LX.Music.MusicInfo
//   top: number
//   style: {
//     position: string
//     left: number
//     right: number
//     top: string
//     height: string
//   }
//   index: number
//   key: string
// }

// export default (props: { list: LX.Music.MusicInfo[], itemHeight: number }) => {
//   const dom_scrollContainer = ref<HTMLElement | null>(null)
//   const dom_list = ref<HTMLElement | null>(null)
//   let startIndex = -1
//   let endIndex = -1
//   let scrollTop = -1
//   let cachedList: ListItem[] = []
//   let cancelScroll: null | (() => void) = null
//   let isScrolling = false
//   let scrollToValue = 0

//   const createList = (startIndex: number, endIndex: number) => {
//     if (startIndex == endIndex) return []
//     console.log(startIndex, endIndex)
//     const cache = cachedList.slice(startIndex, endIndex)
//     const list = props.list.slice(startIndex, endIndex).map((item, i) => {
//       if (cache[i]) return cache[i]
//       const top = (startIndex + i) * props.itemHeight
//       const index = startIndex + i
//       return cachedList[index] = {
//         item,
//         top,
//         style: { position: 'absolute', left: 0, right: 0, top: `${top}px`, height: `${props.itemHeight}px` },
//         index,
//         key: item.id,
//       }
//     })
//     return list
//   }

//   // div.list-item(@click="handleListItemClick($event, index)" @contextmenu="handleListItemRightClick($event, index)"
//   // :class="[{ selected: rightClickSelectedIndex == index }, { active: selectedList.includes(item) }]")
//   // div.list-item-cell.nobreak.center(:style="{ width: rowWidth.r1 }" style="padding-left: 3px; padding-right: 3px;" :class="$style.noSelect" @click.stop) {{ index + 1 }}
//   // div.list-item-cell.auto(:style="{ width: rowWidth.r2 }" :aria-label="item.name + (item.meta._qualitys.flac32bit ? ` - ${$t('tag__lossless_24bit')}` : (item.meta._qualitys.ape || item.meta._qualitys.flac || item.meta._qualitys.wav) ? ` - ${$t('tag__lossless')}` : item.meta._qualitys['320k'] ? ` - ${$t('tag__high_quality')}` : '') + (sourceTag ? ` - ${item.source}` : '')")
//   //   span.select {{ item.name }}
//   //   span.badge.badge-theme-primary(:class="[$style.labelQuality, $style.noSelect]" v-if="item.meta._qualitys.flac32bit") {{ $t('tag__lossless_24bit') }}
//   //   span.badge.badge-theme-primary(:class="[$style.labelQuality, $style.noSelect]" v-else-if="item.meta._qualitys.ape || item.meta._qualitys.flac || item.meta._qualitys.wav") {{ $t('tag__lossless') }}
//   //   span.badge.badge-theme-secondary(:class="[$style.labelQuality, $style.noSelect]" v-else-if="item.meta._qualitys['320k']") {{ $t('tag__high_quality') }}
//   //   span.badge.badge-theme-tertiary(:class="[$style.labelQuality, $style.noSelect]" v-if="sourceTag") {{ item.source }}
//   // div.list-item-cell(:style="{ width: rowWidth.r3 }" :aria-label="item.singer")
//   //   span.select {{ item.singer }}
//   // div.list-item-cell(:style="{ width: rowWidth.r4 }" :aria-label="item.albumName")
//   //   span.select {{ item.meta.albumName }}
//   // div.list-item-cell(:style="{ width: rowWidth.r5 }")
//   //   span(:class="[$style.time, $style.noSelect]") {{ item.meta.interval || '--/--' }}
//   // div.list-item-cell(:style="{ width: rowWidth.r6 }" style="padding-left: 0; padding-right: 0;")
//   //   material-list-buttons(:index="index" :class="$style.btns"
//   //       :remove-btn="false" @btn-click="handleListBtnClick"
//   //       :download-btn="assertApiSupport(item.source)")
//   const renderListItem = (list: ListItem) => {
//     const dom_listItem = document.createElement('div')
//     dom_listItem.className = 'list-item'
//   }

//   const renderList = (list: ListItem[], type?: 'up' | 'down') => {
//     if (!list.length) return
//     console.log(list)
//     const dom = document.createDocumentFragment()
//     for (const item of list) {
//       dom.appendChild(renderListItem(item))
//     }
//     switch (type) {
//       case 'up':
//         break
//       case 'down':
//         break
//       default:
//         // console.log()
//         break
//     }
//   }

//   const updateView = (force = false, currentScrollTop = dom_scrollContainer.value.scrollTop) => {
//     // const currentScrollTop = this.$refs.dom_scrollContainer.scrollTop
//     const itemHeight = props.itemHeight
//     const currentStartIndex = Math.floor(currentScrollTop / itemHeight)
//     const scrollContainerHeight = dom_scrollContainer.value.clientHeight
//     const currentEndIndex = currentStartIndex + Math.ceil(scrollContainerHeight / itemHeight)
//     const continuous = currentStartIndex <= endIndex && currentEndIndex >= startIndex
//     const currentStartRenderIndex = Math.max(currentStartIndex, 0)
//     const currentEndRenderIndex = currentEndIndex + 1
//     // console.log(continuous, currentStartIndex, endIndex, currentEndIndex, startIndex)
//     // debugger
//     if (!force && continuous) {
//       // if (Math.abs(currentScrollTop - this.scrollTop) < this.itemHeight * 0.6) return
//       // console.log('update')
//       if (currentScrollTop > scrollTop) { // scroll down
//         console.log('scroll down')
//         renderList(createList(endIndex + 1, currentEndRenderIndex))
//         //   // views.value.push(...list.slice(list.indexOf(views.value[views.value.length - 1]) + 1))
//         //   // // if (this.views.length > 100) {
//         //   // nextTick(() => {
//         //   //   views.value.splice(0, views.value.indexOf(list[0]))
//         //   // })
//         //   // }
//       } else if (currentScrollTop < scrollTop) { // scroll up
//         console.log('scroll up')
//         renderList(createList(currentStartRenderIndex, startIndex))
//         // views.value = createList(currentStartRenderIndex, currentEndRenderIndex)
//       } else return
//       // if (currentScrollTop == scrollTop && endIndex >= currentEndIndex) return
//       // views.value = createList(currentStartRenderIndex, currentEndRenderIndex)
//     } else {
//       renderList(createList(currentStartRenderIndex, currentEndRenderIndex))
//     }
//     startIndex = currentStartIndex
//     endIndex = currentEndIndex
//     scrollTop = currentScrollTop
//   }

//   const onScroll = event => {
//     const currentScrollTop = dom_scrollContainer.value.scrollTop
//     if (Math.abs(currentScrollTop - scrollTop) > props.itemHeight * 0.6) {
//       updateView(false, currentScrollTop)
//     }
//     emit('scroll', event)
//   }

//   const scrollTo = async(scrollTop, animate = false) => {
//     return new Promise(resolve => {
//       if (cancelScroll) {
//         cancelScroll(resolve)
//       } else {
//         resolve()
//       }
//     }).then(async() => {
//       return new Promise((resolve, reject) => {
//         if (animate) {
//           isScrolling = true
//           scrollToValue = scrollTop
//           cancelScroll = handleScroll(dom_scrollContainer.value, scrollTop, 300, () => {
//             cancelScroll = null
//             isScrolling = false
//             resolve()
//           }, () => {
//             cancelScroll = null
//             isScrolling = false
//             reject('canceled')
//           })
//         } else {
//           dom_scrollContainer.value.scrollTop = scrollTop
//         }
//       })
//     })
//   }

//   const scrollToIndex = async(index, offset = 0, animate = false) => {
//     return scrollTo(Math.max(index * props.itemHeight + offset, 0), animate)
//   }

//   const getScrollTop = () => {
//     return isScrolling ? scrollToValue : dom_scrollContainer.value.scrollTop
//   }

//   const handleResize = () => {
//     setTimeout(updateView)
//   }

//   const contentStyle = computed(() => ({
//     display: 'block',
//     height: props.list.length * props.itemHeight + 'px',
//   }))

//   const handleReset = list => {
//     cachedList = Array(list.length)
//     startIndex = -1
//     endIndex = -1
//     void nextTick(() => {
//       updateView(true)
//     })
//   }
//   watch(() => props.itemHeight, () => {
//     handleReset(props.list)
//   })
//   watch(() => props.list, (list) => {
//     handleReset(list)
//   }, {
//     deep: true,
//   })

//   onMounted(() => {
//     dom_scrollContainer.value!.addEventListener('scroll', onScroll, false)
//     cachedList = Array(props.list.length)
//     startIndex = -1
//     endIndex = -1
//     updateView(true)
//     window.addEventListener('resize', handleResize)
//   })
//   onBeforeUnmount(() => {
//     dom_scrollContainer.value!.removeEventListener('scroll', onScroll)
//     window.removeEventListener('resize', handleResize)
//     if (cancelScroll) cancelScroll()
//   })

//   return {
//     dom_scrollContainer,
//     dom_list,
//     contentStyle,
//     scrollTo,
//     scrollToIndex,
//     getScrollTop,
//   }
// }
export {}
