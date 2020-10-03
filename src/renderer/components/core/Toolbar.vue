<template lang="pug">
  div(:class="[$style.toolbar, setting.controlBtnPosition == 'left' ? $style.controlBtnLeft : $style.controlBtnRight]")
    //- img(v-if="icon")
    //- h1 {{title}}
    material-search-input(:class="$style.input"
      @event="handleEvent" :list="tipList" :visibleList="visibleList"
      v-model="searchText")

    div(:class="$style.logo" v-if="setting.controlBtnPosition == 'left'")    
    div(:class="$style.control" v-else)
      button(type="button" :class="$style.min" :tips="$t('core.toolbar.min')" @click="min")
        svg(:class="$style.icon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-window-minimize')

      //- button(type="button" :class="$style.max" @click="max")
      button(type="button" :class="$style.close" :tips="$t('core.toolbar.close')" @click="close")
        svg(:class="$style.icon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
          use(xlink:href='#icon-window-close')
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import music from '../../utils/music'
import { debounce } from '../../utils'
import { base as eventBaseName } from '../../event/names'
export default {
  data() {
    return {
      searchText: '',
      visibleList: false,
      tipList: [],
      tipSearch: null,
      isFocused: false,
    }
  },
  computed: {
    ...mapGetters(['route', 'setting']),
    ...mapGetters('search', {
      storeSearchText: 'searchText',
    }),
    source() {
      return this.setting.search.tempSearchSource
    },
    isAutoClearSearchInput() {
      return this.setting.odc.isAutoClearSearchInput
    },
    isAutoClearSearchList() {
      return this.setting.odc.isAutoClearSearchList
    },
  },
  watch: {
    route(n) {
      if (n.name != 'search') {
        if (this.isAutoClearSearchInput && this.searchText) this.searchText = ''
        if (this.isAutoClearSearchList) this.clearSearchList()
      }
    },
    storeSearchText(n) {
      if (n !== this.searchText) this.searchText = n
    },
    searchText(n) {
      this.handleTipSearch()
    },
  },
  mounted() {
    this.tipSearch = debounce(() => {
      if (this.searchText === '') {
        this.tipList.splice(0, this.tipList.length)
        music[this.source].tempSearch.cancelTempSearch()
        return
      }
      music[this.source].tempSearch.search(this.searchText).then(list => {
        this.tipList = list
      }).catch(() => {})
    }, 50)
  },
  methods: {
    ...mapMutations('search', {
      clearSearchList: 'clearList',
    }),
    handleEvent({ action, data }) {
      switch (action) {
        case 'focus':
          this.isFocused = true
          if (!this.visibleList) this.visibleList = true
          if (this.searchText) this.handleTipSearch()
          break
        case 'blur':
          this.isFocused = false
          setTimeout(() => {
            if (this.visibleList) this.visibleList = false
          }, 50)
          break
        case 'submit':
          this.handleSearch()
          break
        case 'listClick':
          this.searchText = this.tipList[data]
          this.$nextTick(() => {
            this.handleSearch()
          })
      }
    },

    handleTipSearch() {
      if (!this.visibleList && this.isFocused) this.visibleList = true
      this.tipSearch()
    },

    handleSearch() {
      if (this.visibleList) this.visibleList = false
      setTimeout(() => {
        this.$router.push({
          path: 'search',
          query: {
            text: this.searchText,
          },
        }).catch(_ => _)
      }, 200)
    },

    min() {
      window.eventHub.$emit(eventBaseName.min)
    },
    max() {
      window.eventHub.$emit(eventBaseName.max)
    },
    close() {
      window.eventHub.$emit(eventBaseName.close)
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

@control-btn-width: @height-toolbar * .26;

.toolbar {
  display: flex;
  height: @height-toolbar;
  align-items: center;
  justify-content: space-between;
  padding-left: 15px;
  -webkit-app-region: drag;
  z-index: 2;

  &.controlBtnLeft {
    .control {
      display: none;
    }
  }
  &.controlBtnRight {
    justify-content: space-between;
  }
}

.logo {
  box-sizing: border-box;
  padding: 0 @height-toolbar * .4;
  height: @height-toolbar;
  color: @color-theme;
  flex: none;
  text-align: center;
  line-height: @height-toolbar;
  font-weight: bold;
  // -webkit-app-region: no-drag;
}

.control {
  display: flex;
  align-items: center;
  height: 100%;
  left: 15px;
  -webkit-app-region: no-drag;
  padding: 0 @control-btn-width * 1.5;
  &:hover {
    .icon {
      opacity: 1;
    }
  }

  button {
    display: flex;
    position: relative;
    width: @control-btn-width;
    height: @control-btn-width;
    background: none;
    border: none;
    outline: none;
    padding: 1px;
    cursor: pointer;
    border-radius: 50%;
    color: @color-theme_2;

    + button {
      margin-left: @control-btn-width * 1.2;
    }

    &.min {
      background-color: @color-minBtn;
    }
    &.max {
      background-color: @color-maxBtn;
    }
    &.close {
      background-color: @color-closeBtn;
    }
  }
}

.icon {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}


each(@themes, {
  :global(#container.@{value}) {
    .control {
      button {
        color: ~'@{color-@{value}-theme_2}';

        &.min {
          background-color: ~'@{color-@{value}-minBtn}';
        }
        &.max {
          background-color: ~'@{color-@{value}-maxBtn}';
        }
        &.close {
          background-color: ~'@{color-@{value}-closeBtn}';
        }
      }
    }
    .logo {
      color: ~'@{color-@{value}-theme}';
    }
  }
})
</style>
