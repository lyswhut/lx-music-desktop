<template lang="pug">
  div(:class="$style.container" @click="handleContainerClick")
    div(:class="$style.lists" ref="dom_lists")
      div(:class="$style.listHeader")
        h2(:class="$style.listsTitle") {{$t('core.aside.my_list')}}
        button(:class="$style.listsAdd" @click="handleShowNewList" :tips="$t('view.list.lists_new_list_btn')")
          svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='70%' viewBox='0 0 24 24' space='preserve')
            use(xlink:href='#icon-list-add')
      ul.scroll(:class="$style.listsContent" ref="dom_lists_list")
        li(:class="[$style.listsItem, defaultList.id == listId ? $style.active : null]" :tips="defaultList.name" @click="handleListToggle(defaultList.id)")
          span(:class="$style.listsLabel") {{defaultList.name}}
        li(:class="[$style.listsItem, loveList.id == listId ? $style.active : null]" :tips="loveList.name" @click="handleListToggle(loveList.id)")
          span(:class="$style.listsLabel") {{loveList.name}}
        li.user-list(
          :class="[$style.listsItem, item.id == listId ? $style.active : null, listsData.rightClickItemIndex == index ? $style.clicked : null, fetchingListStatus[item.id] ? $style.fetching : null]"
          @contextmenu="handleListsItemRigthClick($event, index)"
          :tips="item.name" v-for="(item, index) in userList" :key="item.id")
          span(:class="$style.listsLabel" @click="handleListToggle(item.id, index + 2)") {{item.name}}
          input.key-bind(:class="$style.listsInput" @contextmenu.stop type="text" @keyup.enter="handleListsSave(index, $event)" @blur="handleListsSave(index, $event)" :value="item.name" :placeholder="item.name")
        transition(enter-active-class="animated-fast slideInLeft" leave-active-class="animated-fast fadeOut" @after-leave="handleListsNewAfterLeave")
          li(:class="[$style.listsItem, $style.listsNew, listsData.isNewLeave ? $style.newLeave : null]" v-if="listsData.isShowNewList")
            input.key-bind(:class="$style.listsInput" @contextmenu.stop ref="dom_listsNewInput" type="text" @keyup.enter="handleListsCreate" @blur="handleListsCreate" :placeholder="$t('view.list.lists_new_list_input')")
    div(:class="$style.list")
      //- transition
      div(:class="$style.thead")
        table
          thead
            tr
              th.nobreak.center(style="width: 5%;") #
              th.nobreak {{$t('view.list.name')}}
              th.nobreak(style="width: 22%;") {{$t('view.list.singer')}}
              th.nobreak(style="width: 22%;") {{$t('view.list.album')}}
              th.nobreak(style="width: 9%;") {{$t('view.list.time')}}
              th.nobreak(style="width: 15%;") {{$t('view.list.action')}}
      div(v-if="delayShow && list.length" :class="$style.content")
        div.scroll(:class="$style.tbody" @scroll="handleScroll" ref="dom_scrollContent")
          table
            tbody(@contextmenu.capture="handleContextMenu" ref="dom_tbody")
              tr(v-for='(item, index) in list' :key='item.songmid' :id="'mid_' + item.songmid"  @contextmenu="handleListItemRigthClick($event, index)"
                @click="handleDoubleClick($event, index)" :class="[isPlayList && playInfo.playIndex === index ? $style.active : '', assertApiSupport(item.source) ? null : $style.disabled]")
                td.nobreak.center(style="width: 5%; padding-left: 3px; padding-right: 3px;" :class="$style.noSelect" @click.stop) {{index + 1}}
                td.break
                  span.select {{item.name}}
                  span(:class="[$style.labelSource, $style.noSelect]" v-if="isShowSource") {{item.source}}
                  //- span.badge.badge-light(v-if="item._types['128k']") 128K
                  //- span.badge.badge-light(v-if="item._types['192k']") 192K
                  //- span.badge.badge-secondary(v-if="item._types['320k']") 320K
                  //- span.badge.badge-theme-info(v-if="item._types.ape") APE
                  //- span.badge.badge-theme-success(v-if="item._types.flac") FLAC
                td.break(style="width: 22%;")
                  span.select {{item.singer}}
                td.break(style="width: 22%;")
                  span.select {{item.albumName}}
                td(style="width: 9%;")
                  span(:class="[$style.time, $style.noSelect]") {{item.interval || '--/--'}}
                td(style="width: 15%; padding-left: 0; padding-right: 0;")
                  material-list-buttons(:index="index" @btn-click="handleListBtnClick" :download-btn="assertApiSupport(item.source)")
                  //- button.btn-info(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k'] || item._types.flac" @click.stop='openDownloadModal(index)') 下载
                  //- button.btn-secondary(type='button' v-if="item._types['128k'] || item._types['192k'] || item._types['320k']" @click.stop='testPlay(index)') 试听
                  //- button.btn-secondary(type='button' @click.stop='handleRemove(index)') 删除
                  //- button.btn-success(type='button' v-if="(item._types['128k'] || item._types['192k'] || item._types['320k']) && userInfo" @click.stop='showListModal(index)') ＋
      div(:class="$style.noItem" v-else)
        p(v-text="list.length ? $t('view.list.loding_list') : $t('view.list.no_item')")
    material-download-modal(:show="isShowDownload" :musicInfo="musicInfo" @select="handleAddDownload" @close="isShowDownload = false")
    material-download-multiple-modal(:show="isShowDownloadMultiple" :list="selectdListDetailData" @select="handleAddDownloadMultiple" @close="isShowDownloadMultiple = false")
    //- material-flow-btn(:show="isShowEditBtn" :play-btn="false" @btn-click="handleFlowBtnClick")
    material-list-add-modal(:show="isShowListAdd" :is-move="isMove" :from-list-id="listData.id" :musicInfo="musicInfo" :exclude-list-id="excludeListId" @close="handleListAddModalClose")
    material-list-add-multiple-modal(:show="isShowListAddMultiple" :is-move="isMoveMultiple" :from-list-id="listData.id" :musicList="selectdListDetailData" :exclude-list-id="excludeListId" @close="handleListAddMultipleModalClose")
    material-menu(:menus="listsItemMenu" :location="listsData.menuLocation" item-name="name" :isShow="listsData.isShowItemMenu" @menu-click="handleListsItemMenuClick")
    material-menu(:menus="listItemMenu" :location="listMenu.menuLocation" item-name="name" :isShow="listMenu.isShowItemMenu" @menu-click="handleListItemMenuClick")
    material-search-list(:list="list" @action="handleMusicSearchAction" :visible="isVisibleMusicSearch")
    material-list-sort-modal(:show="isShowListSortModal" :music-info="musicInfo" :selected-num="selectdListDetailData.length" @close="isShowListSortModal = false" @confirm="handleSortMusicInfo")
</template>

<script>
import { mapMutations, mapGetters, mapActions } from 'vuex'
import { throttle, scrollTo, clipboardWriteText, assertApiSupport, openUrl } from '../utils'
import musicSdk from '../utils/music'
export default {
  name: 'List',
  data() {
    return {
      listId: null,
      clickTime: window.performance.now(),
      clickIndex: -1,
      isShowDownload: false,
      musicInfo: null,
      selectdListDetailData: [],
      selectdListData: [],
      // isShowEditBtn: false,
      isShowDownloadMultiple: false,
      delayShow: false,
      isShowListAdd: false,
      isShowListAddMultiple: false,
      isShowListSortModal: false,
      delayTimeout: null,
      isToggleList: true,
      focusTarget: 'listDetail',
      keyEvent: {
        isShiftDown: false,
        isModDown: false,
      },
      lastSelectIndex: 0,
      listsData: {
        isShowItemMenu: false,
        itemMenuControl: {
          rename: true,
          sync: false,
          moveup: true,
          movedown: true,
          remove: true,
        },
        rightClickItemIndex: -1,
        menuLocation: {
          x: 0,
          y: 0,
        },
        isShowNewList: false,
        isNewLeave: false,
      },
      listMenu: {
        isShowItemMenu: false,
        itemMenuControl: {
          play: true,
          playLater: true,
          copyName: true,
          addTo: true,
          moveTo: true,
          sort: true,
          download: true,
          search: true,
          remove: true,
          sourceDetail: true,
        },
        menuLocation: {
          x: 0,
          y: 0,
        },
      },
      isMove: false,
      isMoveMultiple: false,
      isVisibleMusicSearch: false,
      fetchingListStatus: {},
    }
  },
  computed: {
    ...mapGetters(['userInfo', 'setting']),
    ...mapGetters('list', ['isInitedList', 'defaultList', 'loveList', 'userList']),
    ...mapGetters('player', ['playInfo']),
    playerListId() {
      return this.playInfo.listId
    },
    isPlayList() {
      return this.playInfo.listId == this.listId
    },
    list() {
      return this.listData.list
    },
    listData() {
      if (!this.listId) return this.defaultList
      let targetList
      switch (this.listId) {
        case 'default':
          targetList = this.defaultList
          break
        case 'love':
          targetList = this.loveList
          break
        default:
          targetList = this.userList.find(l => l.id === this.listId)
          break
      }
      if (targetList) return targetList
      this.handleListToggle(this.defaultList.id)
      return this.defaultList
    },
    excludeListId() {
      return [this.listId]
    },
    lists() {
      return [this.defaultList, this.loveList, ...this.userList]
    },
    isShowSource() {
      return this.setting.list.isShowSource
    },
    listsItemMenu() {
      return [
        {
          name: this.$t('view.list.lists_rename'),
          action: 'rename',
          disabled: !this.listsData.itemMenuControl.rename,
        },
        {
          name: this.$t('view.list.lists_sync'),
          action: 'sync',
          disabled: !this.listsData.itemMenuControl.sync,
        },
        {
          name: this.$t('view.list.lists_moveup'),
          action: 'moveup',
          disabled: !this.listsData.itemMenuControl.moveup,
        },
        {
          name: this.$t('view.list.lists_movedown'),
          action: 'movedown',
          disabled: !this.listsData.itemMenuControl.movedown,
        },
        {
          name: this.$t('view.list.lists_remove'),
          action: 'remove',
          disabled: !this.listsData.itemMenuControl.remove,
        },
      ]
    },
    listItemMenu() {
      return [
        {
          name: this.$t('view.list.list_play'),
          action: 'play',
          disabled: !this.listMenu.itemMenuControl.play,
        },
        {
          name: this.$t('view.list.list_download'),
          action: 'download',
          disabled: !this.listMenu.itemMenuControl.download,
        },
        {
          name: this.$t('view.list.list_play_later'),
          action: 'playLater',
          disabled: !this.listMenu.itemMenuControl.playLater,
        },
        {
          name: this.$t('view.list.list_add_to'),
          action: 'addTo',
          disabled: !this.listMenu.itemMenuControl.addTo,
        },
        {
          name: this.$t('view.list.list_move_to'),
          action: 'moveTo',
          disabled: !this.listMenu.itemMenuControl.moveTo,
        },
        {
          name: this.$t('view.list.list_sort'),
          action: 'sort',
          disabled: !this.listMenu.itemMenuControl.sort,
        },
        {
          name: this.$t('view.list.list_copy_name'),
          action: 'copyName',
          disabled: !this.listMenu.itemMenuControl.copyName,
        },
        {
          name: this.$t('view.list.list_source_detail'),
          action: 'sourceDetail',
          disabled: !this.listMenu.itemMenuControl.sourceDetail,
        },
        {
          name: this.$t('view.list.list_search'),
          action: 'search',
          disabled: !this.listMenu.itemMenuControl.search,
        },
        {
          name: this.$t('view.list.list_remove'),
          action: 'remove',
          disabled: !this.listMenu.itemMenuControl.remove,
        },
      ]
    },
  },
  watch: {
    // selectdListDetailData(n) {
    //   const len = n.length
    //   if (len) {
    //     this.isShowEditBtn = true
    //   } else {
    //     this.isShowEditBtn = false
    //   }
    // },
    'listData.list'(n, o) {
      if (n === o && n.length === o.length) return
      this.removeAllSelectListDetail()
    },
    '$route.query.scrollIndex'(n) {
      if (n == null || this.isToggleList) return
      this.restoreScroll(this.$route.query.scrollIndex, true)
      this.isToggleList = true
    },
  },
  beforeRouteUpdate(to, from, next) {
    this.setPrevSelectListId(to.query.id)
    if (to.query.id == null) return
    else if (to.query.id == this.listId) {
      if (to.query.scrollIndex != null) this.isToggleList = false
      return next()
    }
    this.delayShow = false
    this.$nextTick(() => {
      this.listId = to.query.id
      this.$nextTick(() => {
        this.handleDelayShow()
      })
    })
    this.isShowDownload = false
    this.isShowDownloadMultiple = false
    this.isShowListAdd = false
    this.isShowListAddMultiple = false
    this.isShowListSortModal = false
    this.listMenu.isShowItemMenu = false
    next()
  },
  // mounted() {
  // console.log('mounted')
  // if (this.$route.query.text === undefined) {
  //   let info = this.$store.getters['search/info']
  //   this.text = info.text
  //   this.page = info.page
  // } else if (this.$route.query.text === '') {
  //   this.clearList()
  // } else {
  //   this.text = this.$route.query.text
  //   this.page = 1
  //   this.handleSearch(this.text, this.page)
  // }
  // },
  beforeRouteLeave(to, from, next) {
    this.clearDelayTimeout()
    this.setListScroll({ id: this.listId, location: (this.list.length && this.$refs.dom_scrollContent.scrollTop) || 0 })
    next()
  },
  created() {
    this.listId = this.$route.query.id || this.defaultList.id
    this.setPrevSelectListId(this.listId)
    this.handleSaveScroll = throttle((listId, location) => {
      this.setListScroll({ id: listId, location })
    }, 1000)
    this.listenEvent()
  },
  mounted() {
    this.handleDelayShow()
    this.setListsScroll()
  },
  beforeDestroy() {
    this.unlistenEvent()
    this.setListScroll({ id: this.listId, location: (this.list.length && this.$refs.dom_scrollContent.scrollTop) || 0 })
  },
  methods: {
    ...mapMutations(['setPrevSelectListId']),
    ...mapMutations('list', [
      'listRemove',
      'listRemoveMultiple',
      'setUserListName',
      'createUserList',
      'moveupUserList',
      'movedownUserList',
      'removeUserList',
      'setListScroll',
      'setList',
      'sortList',
    ]),
    ...mapActions('songList', ['getListDetailAll']),
    ...mapActions('download', ['createDownload', 'createDownloadMultiple']),
    ...mapMutations('player', {
      setPlayList: 'setList',
      setTempPlayList: 'setTempPlayList',
    }),
    listenEvent() {
      window.eventHub.$on('key_shift_down', this.handle_key_shift_down)
      window.eventHub.$on('key_shift_up', this.handle_key_shift_up)
      window.eventHub.$on('key_mod_down', this.handle_key_mod_down)
      window.eventHub.$on('key_mod_up', this.handle_key_mod_up)
      window.eventHub.$on('key_mod+a_down', this.handle_key_mod_a_down)
      window.eventHub.$on('key_mod+f_down', this.handle_key_mod_f_down)
    },
    unlistenEvent() {
      window.eventHub.$off('key_shift_down', this.handle_key_shift_down)
      window.eventHub.$off('key_shift_up', this.handle_key_shift_up)
      window.eventHub.$off('key_mod_down', this.handle_key_mod_down)
      window.eventHub.$off('key_mod_up', this.handle_key_mod_up)
      window.eventHub.$off('key_mod+a_down', this.handle_key_mod_a_down)
      window.eventHub.$off('key_mod+f_down', this.handle_key_mod_f_down)
    },
    handle_key_mod_f_down() {
      this.isVisibleMusicSearch = true
    },
    handle_key_shift_down() {
      if (!this.keyEvent.isShiftDown) this.keyEvent.isShiftDown = true
    },
    handle_key_shift_up() {
      if (this.keyEvent.isShiftDown) this.keyEvent.isShiftDown = false
    },
    handle_key_mod_down() {
      if (!this.keyEvent.isModDown) this.keyEvent.isModDown = true
    },
    handle_key_mod_up() {
      if (this.keyEvent.isModDown) this.keyEvent.isModDown = false
    },
    handle_key_mod_a_down({ event }) {
      if (event.target.tagName == 'INPUT') return
      event.preventDefault()
      if (event.repeat) return
      this.keyEvent.isModDown = false
      this.handleSelectAllData()
    },
    handleDelayShow() {
      this.clearDelayTimeout()
      if (this.list.length > 150) {
        this.delayTimeout = setTimeout(() => {
          this.delayTimeout = null
          this.delayShow = true
          this.restoreScroll(this.$route.query.scrollIndex, false)
        }, 200)
      } else {
        this.delayShow = true
        this.restoreScroll(this.$route.query.scrollIndex, false)
      }
    },
    handleScroll(e) {
      this.handleSaveScroll(this.listId, e.target.scrollTop)
    },
    clearDelayTimeout() {
      if (this.delayTimeout) {
        clearTimeout(this.delayTimeout)
        this.delayTimeout = null
      }
    },
    handleScrollList(index, isAnimation, callback = () => {}) {
      let location = this.getMusicLocation(index) - 150
      if (location < 0) location = 0
      if (isAnimation) {
        scrollTo(this.$refs.dom_scrollContent, location, 300, callback)
      } else {
        this.$refs.dom_scrollContent.scrollTo(0, location)
        callback()
      }
    },
    restoreScroll(index, isAnimation) {
      if (!this.list.length) return
      if (index == null) {
        let location = this.listData.location || 0
        if (this.setting.list.isSaveScrollLocation && location) {
          this.$nextTick(() => {
            this.$refs.dom_scrollContent.scrollTo(0, location)
          })
        }
        return
      }

      this.$nextTick(() => {
        this.handleScrollList(index, isAnimation)
        this.$router.replace({
          path: 'list',
          query: {
            id: this.listId,
          },
        })
      })
    },
    handleDoubleClick(event, index) {
      if (event.target.classList.contains('select')) return

      this.handleSelectListDetailData(event, index)

      if (
        window.performance.now() - this.clickTime > 400 ||
        this.clickIndex !== index
      ) {
        this.clickTime = window.performance.now()
        this.clickIndex = index
        return
      }
      this.testPlay(index)
      this.clickTime = 0
      this.clickIndex = -1
    },
    handleSelectListDetailData(event, clickIndex) {
      if (this.focusTarget != 'listDetail' && this.selectdListDetailData.length) this.removeAllSelectListDetail()

      if (this.keyEvent.isShiftDown) {
        if (this.selectdListDetailData.length) {
          let lastSelectIndex = this.lastSelectIndex
          if (lastSelectIndex == clickIndex) return this.removeAllSelectListDetail()
          this.removeAllSelectListDetail()
          let isNeedReverse = false
          if (clickIndex < lastSelectIndex) {
            let temp = lastSelectIndex
            lastSelectIndex = clickIndex
            clickIndex = temp
            isNeedReverse = true
          }
          this.selectdListDetailData = this.list.slice(lastSelectIndex, clickIndex + 1)
          if (isNeedReverse) this.selectdListDetailData.reverse()
          let nodes = this.$refs.dom_tbody.childNodes
          do {
            nodes[lastSelectIndex].classList.add('active')
            lastSelectIndex++
          } while (lastSelectIndex <= clickIndex)
        } else {
          event.currentTarget.classList.add('active')
          this.selectdListDetailData.push(this.list[clickIndex])
          this.lastSelectIndex = clickIndex
        }
      } else if (this.keyEvent.isModDown) {
        this.lastSelectIndex = clickIndex
        let item = this.list[clickIndex]
        let index = this.selectdListDetailData.indexOf(item)
        if (index < 0) {
          this.selectdListDetailData.push(item)
          event.currentTarget.classList.add('active')
        } else {
          this.selectdListDetailData.splice(index, 1)
          event.currentTarget.classList.remove('active')
        }
      } else if (this.selectdListDetailData.length) this.removeAllSelectListDetail()
    },
    handleSelectListData(event, clickIndex) {
      if (this.focusTarget != 'list' && this.selectdListData.length) this.removeAllSelectList()

      if (this.keyEvent.isShiftDown) {
        if (this.selectdListData.length) {
          let lastSelectIndex = this.list.indexOf(this.selectdListData[this.selectdListData.length - 1])
          if (lastSelectIndex == clickIndex) return this.removeAllSelectList()
          this.removeAllSelectList()
          let isNeedReverse = false
          if (clickIndex < lastSelectIndex) {
            let temp = lastSelectIndex
            lastSelectIndex = clickIndex
            clickIndex = temp
            isNeedReverse = true
          }
          this.selectdListData = this.list.slice(lastSelectIndex, clickIndex + 1)
          if (isNeedReverse) this.selectdListData.reverse()
          let nodes = this.$refs.dom_tbody.childNodes
          do {
            nodes[lastSelectIndex].classList.add('active')
            lastSelectIndex++
          } while (lastSelectIndex <= clickIndex)
        } else {
          event.currentTarget.classList.add('active')
          this.selectdListData.push(this.list[clickIndex])
        }
      } else if (this.keyEvent.isModDown) {
        let item = this.list[clickIndex]
        let index = this.selectdListData.indexOf(item)
        if (index < 0) {
          this.selectdListData.push(item)
          event.currentTarget.classList.add('active')
        } else {
          this.selectdListData.splice(index, 1)
          event.currentTarget.classList.remove('active')
        }
      } else if (this.selectdListData.length) this.removeAllSelectList()
    },
    removeAllSelectListDetail() {
      this.selectdListDetailData = []
      let dom_tbody = this.$refs.dom_tbody
      if (!dom_tbody) return
      let nodes = dom_tbody.querySelectorAll('.active')
      for (const node of nodes) {
        if (node.parentNode == dom_tbody) node.classList.remove('active')
      }
    },
    removeAllSelectList() {
      this.selectdListData = []
      let dom_list = this.$refs.dom_lists_list
      if (!dom_list) return
      let nodes = dom_list.querySelectorAll('.selected')
      for (const node of nodes) {
        if (node.parentNode == dom_list) node.classList.remove('selected')
      }
    },
    testPlay(index) {
      // if (!this.assertApiSupport(this.list[index].source)) return
      this.setPlayList({ list: this.listData, index })
    },
    handleRemove(index) {
      this.listRemove({ id: this.listId, index })
    },
    handleListBtnClick(info) {
      switch (info.action) {
        case 'download': {
          const minfo = this.list[info.index]
          // if (!this.assertApiSupport(minfo.source)) return
          this.musicInfo = minfo
          this.$nextTick(() => {
            this.isShowDownload = true
          })
          break
        }
        case 'play':
          this.testPlay(info.index)
          break
        case 'remove':
          this.handleRemove(info.index)
          break
        case 'listAdd':
          this.musicInfo = this.list[info.index]
          this.$nextTick(() => {
            this.isShowListAdd = true
          })
          break
      }
    },
    handleAddDownload(type) {
      this.createDownload({ musicInfo: this.musicInfo, type })
      this.isShowDownload = false
    },
    handleSelectAllData() {
      this.removeAllSelectListDetail()
      this.selectdListDetailData = [...this.list]
      let nodes = this.$refs.dom_tbody.childNodes
      for (const node of nodes) {
        node.classList.add('active')
      }
      // asyncSetArray(this.selectdListDetailData, isSelect ? [...this.list] : [])
    },
    handleAddDownloadMultiple(type) {
      const list = this.selectdListDetailData.filter(s => this.assertApiSupport(s.source))
      this.createDownloadMultiple({ list, type })
      this.removeAllSelectListDetail()
      this.isShowDownloadMultiple = false
    },
    // handleFlowBtnClick(action) {
    //   switch (action) {
    //     case 'download':
    //       this.isShowDownloadMultiple = true
    //       break
    //     case 'remove':
    //       this.listRemoveMultiple({ id: this.listId, list: this.selectdListDetailData })
    //       this.removeAllSelectListDetail()
    //       break
    //     case 'add':
    //       this.isShowListAddMultiple = true
    //       break
    //   }
    // },
    handleListAddModalClose() {
      this.isShowListAdd = false
      if (this.isMove) this.isMove = false
    },
    handleListAddMultipleModalClose(isClearSelect) {
      if (isClearSelect) this.removeAllSelectListDetail()
      this.isShowListAddMultiple = false
      if (this.isMoveMultiple) this.isMoveMultiple = false
    },
    getMusicLocation(index) {
      let dom = document.getElementById('mid_' + this.list[index].songmid)
      return dom ? dom.offsetTop : 0
    },
    // handleScroll(e) {
    //   console.log(e.target.scrollTop)
    // },
    handleContextMenu(event) {
      if (!event.target.classList.contains('select')) return
      event.stopImmediatePropagation()
      let classList = this.$refs.dom_scrollContent.classList
      classList.add(this.$style.copying)
      window.requestAnimationFrame(() => {
        let str = window.getSelection().toString()
        classList.remove(this.$style.copying)
        str = str.trim()
        if (!str.length) return
        clipboardWriteText(str)
      })
    },
    assertApiSupport(source) {
      return assertApiSupport(source)
    },
    handleContainerClick(event) {
      if (!this.$refs.dom_lists) return
      let isFocusList = event.target == this.$refs.dom_lists || this.$refs.dom_lists.contains(event.target)
      this.focusTarget = isFocusList ? 'list' : 'listDetail'
    },
    handleListsSave(index, event) {
      let dom_target = this.$refs.dom_lists_list.querySelector('.' + this.$style.editing)
      if (dom_target) dom_target.classList.remove(this.$style.editing)
      let name = event.target.value.trim()
      if (name.length) return this.setUserListName({ index, name })
      event.target.value = this.userList[index].name
    },
    handleListsCreate(event) {
      if (event.target.readonly) return
      let name = event.target.value.trim()
      event.target.readonly = true

      if (name == '') {
        this.listsData.isShowNewList = false
        return
      }

      this.listsData.isNewLeave = true
      this.$nextTick(() => {
        this.listsData.isShowNewList = false
      })

      this.createUserList({ name })
    },
    handleShowNewList() {
      this.listsData.isShowNewList = true
      this.$nextTick(() => {
        this.$refs.dom_listsNewInput.focus()
      })
    },
    handleListsNewAfterLeave() {
      this.listsData.isNewLeave = false
    },
    setListsScroll() {
      let target = this.$refs.dom_lists_list.querySelector('.' + this.$style.active)
      if (!target) return
      let offsetTop = target.offsetTop
      let location = offsetTop - 150
      if (location > 0) this.$refs.dom_lists_list.scrollTop = location
    },
    handleListToggle(id) {
      if (id == this.listId) return
      this.$router.push({
        path: 'list',
        query: { id },
      }).catch(_ => _)
    },
    handleListsItemRigthClick(event, index) {
      const source = this.userList[index].source
      this.listsData.itemMenuControl.sync = !!source && !!musicSdk[source].songList
      this.listsData.itemMenuControl.moveup = index > 0
      this.listsData.itemMenuControl.movedown = index < this.userList.length - 1
      this.listsData.rightClickItemIndex = index
      this.listsData.menuLocation.x = event.currentTarget.offsetLeft + event.offsetX
      this.listsData.menuLocation.y = event.currentTarget.offsetTop + event.offsetY - this.$refs.dom_lists_list.scrollTop
      this.hideListMenu()
      this.$nextTick(() => {
        this.listsData.isShowItemMenu = true
      })
    },
    handleListItemRigthClick(event, index) {
      this.listMenu.itemMenuControl.sourceDetail = !!musicSdk[this.list[index].source].getMusicDetailPageUrl
      // this.listMenu.itemMenuControl.play =
      //   this.listMenu.itemMenuControl.playLater =
      this.listMenu.itemMenuControl.download =
        this.assertApiSupport(this.list[index].source)
      let dom_selected = this.$refs.dom_tbody.querySelector('tr.selected')
      if (dom_selected) dom_selected.classList.remove('selected')
      this.$refs.dom_tbody.querySelectorAll('tr')[index].classList.add('selected')
      let dom_td = event.target.closest('td')

      this.listMenu.rightClickItemIndex = index
      this.listMenu.menuLocation.x = dom_td.offsetLeft + event.offsetX
      this.listMenu.menuLocation.y = dom_td.offsetTop + event.offsetY - this.$refs.dom_scrollContent.scrollTop
      this.hideListsMenu()
      this.$nextTick(() => {
        this.listMenu.isShowItemMenu = true
      })
    },
    hideListsMenu() {
      this.listsData.isShowItemMenu = false
      this.listsData.rightClickItemIndex = -1
    },
    handleListsItemMenuClick(action) {
      // console.log(action)
      let index = this.listsData.rightClickItemIndex
      this.hideListsMenu()
      this.listsData.isShowItemMenu = false
      let dom
      switch (action && action.action) {
        case 'rename':
          dom = this.$refs.dom_lists_list.querySelectorAll('.user-list')[index]
          this.$nextTick(() => {
            dom.classList.add(this.$style.editing)
            dom.querySelector('input').focus()
          })
          break
        case 'sync':
          this.handleSyncSourceList(index)
          break
        case 'moveup':
          this.moveupUserList(index)
          break
        case 'movedown':
          this.movedownUserList(index)
          break
        case 'remove':
          this.removeUserList(index)
          break
      }
    },
    hideListMenu() {
      let dom_selected = this.$refs.dom_tbody && this.$refs.dom_tbody.querySelector('tr.selected')
      if (dom_selected) dom_selected.classList.remove('selected')
      this.listMenu.isShowItemMenu = false
      this.listMenu.rightClickItemIndex = -1
    },
    handleListItemMenuClick(action) {
      // console.log(action)
      let index = this.listMenu.rightClickItemIndex
      this.hideListMenu()
      let minfo
      let url
      switch (action && action.action) {
        case 'play':
          this.testPlay(index)
          break
        case 'playLater':
          if (this.selectdListDetailData.length) {
            this.setTempPlayList(this.selectdListDetailData.map(s => ({ listId: this.listId, musicInfo: s })))
            this.removeAllSelectListDetail()
          } else {
            this.setTempPlayList([{ listId: this.listId, musicInfo: this.list[index] }])
          }
          break
        case 'copyName':
          minfo = this.list[index]
          clipboardWriteText(this.setting.download.fileName.replace('歌名', minfo.name).replace('歌手', minfo.singer))
          break
        case 'addTo':
          if (this.selectdListDetailData.length) {
            this.$nextTick(() => {
              this.isShowListAddMultiple = true
            })
          } else {
            this.musicInfo = this.list[index]
            this.$nextTick(() => {
              this.isShowListAdd = true
            })
          }
          break
        case 'moveTo':
          if (this.selectdListDetailData.length) {
            this.isMoveMultiple = true
            this.$nextTick(() => {
              this.isShowListAddMultiple = true
            })
          } else {
            this.musicInfo = this.list[index]
            this.isMove = true
            this.$nextTick(() => {
              this.isShowListAdd = true
            })
          }
          break
        case 'download':
          if (this.selectdListDetailData.length) {
            this.isShowDownloadMultiple = true
          } else {
            minfo = this.list[index]
            if (!this.assertApiSupport(minfo.source)) return
            this.musicInfo = minfo
            this.$nextTick(() => {
              this.isShowDownload = true
            })
          }
          break
        case 'sort':
          this.isShowListSortModal = true
          this.musicInfo = this.list[index]
          // if (this.selectdListDetailData.length) {
          //   this.isShowDownloadMultiple = true
          // } else {
          //   minfo = this.list[index]
          //   if (!this.assertApiSupport(minfo.source)) return
          //   this.musicInfo = minfo
          //   this.$nextTick(() => {
          //     this.isShowDownload = true
          //   })
          // }
          break
        case 'search':
          minfo = this.list[index]
          this.handleSearch(minfo)
          break
        case 'remove':
          if (this.selectdListDetailData.length) {
            this.listRemoveMultiple({ id: this.listId, list: this.selectdListDetailData })
            this.removeAllSelectListDetail()
          } else {
            this.handleRemove(index)
          }
          break
        case 'sourceDetail':
          minfo = this.list[index]
          url = musicSdk[minfo.source].getMusicDetailPageUrl(minfo)
          if (!url) return
          openUrl(url)
      }
    },
    handleMusicSearchAction({ action, data: { index, isPlay } = {} }) {
      this.isVisibleMusicSearch = false
      switch (action) {
        case 'listClick':
          if (index < 0) return
          this.handleScrollList(index, true, () => {
            let dom = document.getElementById('mid_' + this.list[index].songmid)
            dom.classList.add('selected')
            setTimeout(() => {
              dom.classList.remove('selected')
              if (isPlay) this.testPlay(index)
            }, 600)
          })
          break
      }
    },
    fetchList(id, source, sourceListId) {
      if (this.fetchingListStatus[id] == null) {
        this.$set(this.fetchingListStatus, id, true)
      } else {
        this.fetchingListStatus[id] = true
      }
      return this.getListDetailAll({ source, id: sourceListId }).finally(() => {
        this.fetchingListStatus[id] = false
      })
    },
    async handleSyncSourceList(index) {
      const targetListInfo = this.userList[index]
      const list = await this.fetchList(targetListInfo.id, targetListInfo.source, targetListInfo.sourceListId)
      // console.log(targetListInfo.list.length, list.length)
      this.removeAllSelectListDetail()
      this.setList({
        ...targetListInfo,
        list,
      })
    },
    handleSortMusicInfo(num) {
      num = Math.min(num, this.list.length)
      this.sortList({
        id: this.listId,
        sortNum: num,
        musicInfos: this.selectdListDetailData.length ? [...this.selectdListDetailData] : [this.musicInfo],
      })
      this.removeAllSelectListDetail()
      this.isShowListSortModal = false
    },
    handleSearch(musicInfo) {
      this.$router.push({
        path: 'search',
        query: {
          text: `${musicInfo.name} ${musicInfo.singer}`,
        },
      })
    },
  },
}
</script>

<style lang="less" module>
@import '../assets/styles/layout.less';

.container {
  overflow: hidden;
  height: 100%;
  display: flex;
  position: relative;
}

@lists-item-height: 36px;
.lists {
  flex: none;
  width: 16%;
  display: flex;
  flex-flow: column nowrap;
}
.listHeader {
  position: relative;
  &:hover {
    .listsAdd {
      opacity: 1;
    }
  }
}
.listsTitle {
  font-size: 12px;
  line-height: 38px;
  padding: 0 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  flex: none;
}
.listsAdd {
  position: absolute;
  right: 0;
  top: 8px;
  background: none;
  height: 30px;
  border: none;
  outline: none;
  border-radius: @radius-border;
  cursor: pointer;
  opacity: 0;
  transition: opacity @transition-theme;
  color: @color-btn;
  svg {
    vertical-align: bottom;
  }
  &:active {
    opacity: .7 !important;
  }
}
.listsContent {
  flex: auto;
  min-width: 0;
  overflow-y: scroll;
  overflow-x: hidden;
  // border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.listsItem {
  position: relative;
  transition: .3s ease;
  transition-property: color, background-color, opacity;
  background-color: transparent;
  &:hover:not(.active) {
    background-color: @color-theme_2-hover;
    cursor: pointer;
  }
  &.active {
    // background-color:
    color: @color-theme;
  }
  &.selected {
    background-color: @color-theme_2-active;
  }
  &.clicked {
    background-color: @color-theme_2-hover;
  }
  &.fetching {
    opacity: .5;
  }
  &.editing {
    padding: 0 10px;
    background-color: @color-theme_2-hover;
    .listsLabel {
      display: none;
    }
    .listsInput {
      display: block;
    }
  }
}
.listsLabel {
  display: block;
  height: @lists-item-height;
  padding: 0 10px;
  font-size: 13px;
  line-height: @lists-item-height;
  .mixin-ellipsis-1;
}
.listsInput {
  width: 100%;
  height: @lists-item-height;
  border: none;
  padding: 0;
  // padding-bottom: 1px;
  line-height: @lists-item-height;
  background: none;
  outline: none;
  font-size: 13px;
  display: none;
  font-family: inherit;
}

.listsNew {
  padding: 0 10px;
  background-color: @color-theme_2-hover;
  .listsInput {
    display: block;
  }
}
.newLeave {
  margin-top: -@lists-item-height;
  z-index: -1;
}

.list {
  overflow: hidden;
  height: 100%;
  flex: auto;
  display: flex;
  flex-flow: column nowrap;
  // .noItem {

  // }
}
.content {
  min-height: 0;
  font-size: 14px;
  display: flex;
  flex-flow: column nowrap;
  // table {
  //   position: relative;
  //   thead {
  //     position: fixed;
  //     width: 100%;
  //     th {
  //       width: 100%;
  //     }
  //   }
  // }
}
.thead {
  flex: none;
  tr > th:first-child {
    color: @color-theme_2-font-label;
    // padding-left: 10px;
  }
}
.tbody {
  flex: auto;
  overflow-y: auto;

  tr {
    &.active {
      color: @color-btn;
    }
  }
  td {
    font-size: 12px;

    &:first-child {
      // padding-left: 10px;
      font-size: 11px;
      color: @color-theme_2-font-label;
    }
  }

  &.copying {
    .no-select {
      display: none;
    }
  }
}

.labelSource {
  color: @color-theme;
  padding: 5px;
  font-size: .8em;
  line-height: 1;
  opacity: .75;
}

.disabled {
  opacity: .5;
}

.no-item {
  position: relative;
  height: 100%;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  p {
    font-size: 24px;
    color: @color-theme_2-font-label;
  }
}

each(@themes, {
  :global(#container.@{value}) {
    .listsAdd {
      color: ~'@{color-@{value}-btn}';
    }
    .listsItem {
      &:hover:not(.active) {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &.active {
        color: ~'@{color-@{value}-theme}';
      }
      &.select {
        background-color: ~'@{color-@{value}-theme_2-active}';
      }
      &.clicked {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
      &.editing {
        background-color: ~'@{color-@{value}-theme_2-hover}';
      }
    }
    .listsNew {
      background-color: ~'@{color-@{value}-theme_2-hover}';
    }
    .tbody {
      tr {
        &.active {
          color: ~'@{color-@{value}-btn}';
        }
      }
      td {
        &:first-child {
          color: ~'@{color-@{value}-theme_2-font-label}';
        }
      }
    }
    .labelSource {
      color: ~'@{color-@{value}-theme}';
    }
    .no-item {
      p {
        color: ~'@{color-@{value}-theme_2-font-label}';
      }
    }
  }
})

</style>
