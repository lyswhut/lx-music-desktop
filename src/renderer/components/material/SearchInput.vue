<template lang="pug">
div(:class="[$style.search, focus ? $style.active : '']")
  div(:class="$style.form")
    input(placeholder="Search for something..." v-model.trim="text"
          @focus="handleFocus" @blur="handleBlur" @input="handleInput"
          @keyup.enter="handleSearch")
    button(type="button" @click="handleSearch")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 30.239 30.239' space='preserve')
        use(xlink:href='#icon-search')
  //- transition(name="custom-classes-transition"
  //-             enter-active-class="animated flipInX"
  //-             leave-active-class="animated flipOutX")
  div(:class="$style.list" :style="listStyle")
    ul(ref="dom_list")
      li(v-for="(item, index) in list" :key="item" @click="handleTemplistClick(index)")
        span {{item}}
</template>

<script>
import { mapGetters } from 'vuex'
import music from '../../utils/music'

export default {
  data() {
    return {
      isShow: false,
      text: '',
      list: [],
      index: null,
      focus: false,
      listStyle: {
        height: 0,
      },
    }
  },
  computed: {
    ...mapGetters(['source', 'route', 'setting']),
    ...mapGetters('search', ['info']),
    isAutoClearInput() {
      return this.setting.odc.isAutoClearSearchInput
    },
  },
  watch: {
    list(n) {
      this.$nextTick(() => {
        this.listStyle.height = this.$refs.dom_list.scrollHeight + 'px'
      })
    },
    'info.text'(n) {
      if (n !== this.text) this.text = n
    },
    route(n) {
      if (this.isAutoClearInput && n.name != 'search' && this.text) this.text = ''
    },
  },
  methods: {
    handleTemplistClick(index) {
      this.text = this.list[index]
      this.handleSearch()
    },
    handleFocus() {
      this.focus = true
      if (this.text) this.handleInput()
      this.showList()
    },
    handleBlur() {
      setTimeout(() => {
        this.focus = false
        this.hideList()
      }, 200)
    },
    handleSearch() {
      this.hideList()
      this.$router.push({
        path: 'search',
        query: {
          text: this.text,
        },
      })
    },
    handleInput() {
      if (this.text === '') {
        this.list.splice(0, this.list.length)
        music[this.source.id].tempSearch.cancelTempSearch()
        return
      }
      if (!this.isShow) this.showList()
      music[this.source.id].tempSearch.search(this.text).then(list => {
        this.list = list
      }).catch(() => {})
    },
    showList() {
      this.isShow = true
      this.listStyle.height = this.$refs.dom_list.scrollHeight + 'px'
    },
    hideList() {
      this.isShow = false
      this.listStyle.height = 0
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.search {
  position: absolute;
  left: 15px;
  top: 13px;
  border-radius: 3px;
  transition: box-shadow .4s ease, background-color @transition-theme;
  display: flex;
  flex-flow: column nowrap;
  width: 240px;
  background-color: @color-search-form-background;

  &.active {
    box-shadow: 0 1px 5px 0 rgba(0,0,0,.2);
    .form {
      input {
        border-bottom-left-radius: 0;
      }
      button {
        border-bottom-right-radius: 0;
      }
    }
  }
  .form {
    display: flex;
    height: @height-toolbar / 2;
    position: relative;
    input {
      flex: auto;
      // border: 1px solid;
      border-top-left-radius: 3px;
      border-bottom-left-radius: 3px;
      background-color: transparent;
      // border-bottom: 2px solid @color-theme;
      // border-color: @color-theme;
      border: none;

      outline: none;
      // height: @height-toolbar * .7;
      padding: 0 5px;
      overflow: hidden;
      &::placeholder {
        color: @color-btn;
      }
    }
    button {
      flex: none;
      border: none;
      // background-color: @color-search-form-background;
      background-color: transparent;
      outline: none;
      border-top-right-radius: 3px;
      border-bottom-right-radius: 3px;
      cursor: pointer;
      height: 100%;
      padding: 5px 7px;
      color: @color-btn;
      transition: background-color .2s ease;

      &:hover {
        background-color: @color-theme-hover;
      }
      &:active {
        background-color: @color-theme-active;
      }
    }
  }
  .list {
    // background-color: @color-search-form-background;
    font-size: 13px;
    transition: .3s ease;
    height: 0;
    transition-property: height;
    overflow: hidden;
    li {
      cursor: pointer;
      padding: 8px 5px;
      transition: background-color .2s ease;
      line-height: 1.3;
      span {
        .mixin-ellipsis-2;
      }

      &:hover {
        background-color: @color-search-list-hover;
      }
      &:last-child {
        border-bottom-left-radius: 3px;
        border-bottom-right-radius: 3px;
      }
    }
  }
}

each(@themes, {
  :global(#container.@{value}) {

    .search {
      background-color: ~'@{color-@{value}-search-form-background}';
      &.active {
        box-shadow: 0 1px 5px 0 rgba(0,0,0,.2);
      }

      .form {
        input {
          &::placeholder {
            color: ~'@{color-@{value}-btn}';
          }
        }
        button {
          color: ~'@{color-@{value}-btn}';

          &:hover {
            background-color: ~'@{color-@{value}-theme-hover}';
          }
          &:active {
            background-color: ~'@{color-@{value}-theme-active}';
          }
        }
      }
      .list {
        li {
          &:hover {
            background-color: ~'@{color-@{value}-search-list-hover}';
          }
        }
      }
    }
  }
})

</style>
