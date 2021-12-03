<template>
<div :class="$style.pagination" v-if="allPage &gt; 1">
  <ul>
    <li v-if="page===1" :class="$style.disabled"><span>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
          <use xlink:href="#icon-left"></use>
        </svg></span></li>
    <li v-else>
      <button type="button" @click="handleClick(page - 1)" :tips="$t('pagination__prev')">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
          <use xlink:href="#icon-left"></use>
        </svg>
      </button>
    </li>
    <li v-if="allPage &gt; btnLength &amp;&amp; page &gt; pageEvg+1" :class="$style.first">
      <button type="button" @click="handleClick(1)" :tips="$t('pagination__page', { num: 1 })">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
          <use xlink:href="#icon-first"></use>
        </svg>
      </button>
    </li>
    <li v-for="(p, index) in pages" :key="index" :class="{[$style.active] : p == page}"><span v-if="p === page" v-text="page"></span>
      <button v-else type="button" @click="handleClick(p)" v-text="p" :tips="$t('pagination__page', { num: p })"></button>
    </li>
    <li v-if="allPage &gt; btnLength &amp;&amp; allPage - page &gt; pageEvg" :class="$style.last">
      <button type="button" @click="handleClick(allPage)" :tips="$t('pagination__page', { num: allPage })">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
          <use xlink:href="#icon-last"></use>
        </svg>
      </button>
    </li>
    <li v-if="page===allPage" :class="$style.disabled"><span>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
          <use xlink:href="#icon-right"></use>
        </svg></span></li>
    <li v-else>
      <button type="button" @click="handleClick(page + 1)" :tips="$t('pagination__next')">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
          <use xlink:href="#icon-right"></use>
        </svg>
      </button>
    </li>
  </ul>
</div>

</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    count: {
      type: Number,
      default: 0,
    },
    limit: {
      type: Number,
      default: 10,
    },
    page: {
      type: Number,
      default: 1,
    },
    btnLength: {
      type: Number,
      default: 7,
    },
    maxPage: {
      type: Number,
      default: null,
    },
  },
  data() {
    return {
      pageArr: [],
    }
  },
  computed: {
    ...mapGetters(['userInfo']),
    allPage() {
      return this.maxPage == null ? Math.ceil(this.count / this.limit) || 1 : this.maxPage
    },
    pageEvg() {
      return Math.floor(this.btnLength / 2)
    },
    pages() {
      if (this.allPage <= this.btnLength) return this.pageArr
      let start =
        this.page - this.pageEvg > 1
          ? this.allPage - this.page < this.pageEvg + 1
            ? this.allPage - (this.btnLength - 1)
            : this.page - this.pageEvg
          : 1
      let end =
        this.page + this.pageEvg <= this.btnLength
          ? this.btnLength
          : this.page + this.pageEvg <= this.allPage
            ? this.page + this.pageEvg
            : this.allPage
      // console.log(start-1);
      // console.log(end);
      // console.log(this.pageArr.slice(start-1, end-1));
      return this.pageArr.slice(start - 1, end)
    },
  },
  watch: {
    allPage() {
      this.initPageArr()
    },
  },
  methods: {
    initPageArr() {
      this.pageArr = []
      for (let i = 1; i <= this.allPage; i++) this.pageArr.push(i)
    },
    handleClick(page) {
      this.$emit('btn-click', page)
    },
  },
  mounted() {
    this.initPageArr()
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.pagination {
  display: inline-block;
  background-color: @color-pagination-background;
  // border-top-left-radius: 8px;
  border-radius: @radius-border;
  ul {
    display: flex;
    flex-flow: row nowrap;
    // border: .0625rem solid @theme_color2;
    // border-radius: .3125rem;
    li {
      // margin-right: @padding;
      color: @color-theme;
      // border: .0625rem solid @theme_line;
      // border-radius: .3125rem;
      transition: 0.4s ease;
      transition-property: all;
      line-height: 1;
      display: flex;
      // border-right: none;
      svg {
        height: 1em;
      }
      span,
      button {
        display: block;
        padding: 7px 12px;
        line-height: 1;
        color: @color-theme;
        font-size: 13px;
      }
      &.active {
        span {
          background-color: @color-pagination-select;
        }
      }
      button {
        background-color: transparent;
        border: none;
        cursor: pointer;
        outline: none;
        transition: background-color .3s ease;
        &:hover {
          background-color: @color-pagination-hover;
        }
        &:active {
          background-color: @color-pagination-active;
        }
      }
      &.disabled {
        span {
          opacity: .3;
        }
      }
      &:first-child {
        span, button {
          border-top-left-radius: @radius-border;
          border-bottom-left-radius: @radius-border;
        }
        // border-right: .0625rem solid @theme_line;
      }
      &:last-child {
        span, button {
          border-top-right-radius: @radius-border;
          border-bottom-right-radius: @radius-border;
        }
        // border-right: .0625rem solid @theme_line;
      }
      &:first-child, &:last-child, &.first, &.last {
        span,
        button {
          line-height: 0;
        }
      }
    }
  }
}


each(@themes, {
  :global(#root.@{value}) {

    .pagination {
      background-color: ~'@{color-@{value}-pagination-background}';
      ul {
        li {
          color: ~'@{color-@{value}-theme}';
          span,
          button {
            color: ~'@{color-@{value}-theme}';
          }
          &.active {
            span {
              background-color: ~'@{color-@{value}-pagination-select}';
            }
          }
          button {
            &:hover {
              background-color: ~'@{color-@{value}-pagination-hover}';
            }
            &:active {
              background-color: ~'@{color-@{value}-pagination-active}';
            }
          }
        }
      }
    }
  }
})

</style>
