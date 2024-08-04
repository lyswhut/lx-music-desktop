<template>
  <div v-if="maxPage > 1" :class="$style.pagination">
    <ul>
      <li v-if="page == 1" :class="$style.disabled">
        <span>
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
            <use xlink:href="#icon-left" />
          </svg>
        </span>
      </li>
      <li v-else>
        <button type="button" :aria-label="$t('pagination__prev')" @click="handleClick(page - 1)">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
            <use xlink:href="#icon-left" />
          </svg>
        </button>
      </li>
      <li v-if="maxPage > btnLength && page > pageEvg+1" :class="$style.first">
        <button type="button" :aria-label="$t('pagination__page', { num: 1 })" @click="handleClick(1)">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
            <use xlink:href="#icon-first" />
          </svg>
        </button>
      </li>
      <li v-for="p in pages" :key="p" :class="{[$style.active] : p == page}">
        <span v-if="p === page" v-text="page" />
        <button v-else type="button" :aria-label="$t('pagination__page', { num: p })" @click="handleClick(p)" v-text="p" />
      </li>
      <li v-if="maxPage > btnLength && maxPage - page > pageEvg" :class="$style.last">
        <button type="button" :aria-label="$t('pagination__page', { num: maxPage })" @click="handleClick(maxPage)">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
            <use xlink:href="#icon-last" />
          </svg>
        </button>
      </li>
      <li v-if="page == maxPage" :class="$style.disabled">
        <span>
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
            <use xlink:href="#icon-right" />
          </svg></span>
      </li>
      <li v-else>
        <button type="button" :aria-label="$t('pagination__next')" @click="handleClick(page + 1)">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.846 451.847" space="preserve">
            <use xlink:href="#icon-right" />
          </svg>
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
import { computed } from '@common/utils/vueTools'

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
  },
  emits: ['btn-click'],
  setup(props, { emit }) {
    const maxPage = computed(() => {
      return Math.ceil(props.count / props.limit) || 1
    })
    const pageEvg = computed(() => {
      return Math.floor(props.btnLength / 2)
    })
    const pages = computed(() => {
      if (maxPage.value <= props.btnLength) return Array.from({ length: maxPage.value }, (_, i) => i + 1)
      let start = props.page - pageEvg.value > 1
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        ? maxPage.value - props.page < pageEvg.value + 1
          ? maxPage.value - (props.btnLength - 1)
          : props.page - pageEvg.value
        : 1
      return Array.from({ length: props.btnLength }, (_, i) => start + i)
    })

    const handleClick = (page) => {
      emit('btn-click', page)
    }

    return {
      maxPage,
      pageEvg,
      pages,
      handleClick,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.pagination {
  display: inline-block;
  background-color: var(--color-button-background);
  // border-top-left-radius: 8px;
  border-radius: @radius-border;
  ul {
    display: flex;
    flex-flow: row nowrap;
    // border: .0625rem solid @theme_color2;
    // border-radius: .3125rem;
    li {
      // margin-right: @padding;
      // color: var(--color-button-font);
      // border: .0625rem solid @theme_line;
      // border-radius: .3125rem;
      transition: 0.4s ease;
      transition-property: all;
      line-height: 1.2;
      display: flex;
      // border-right: none;
      svg {
        height: 1em;
      }
      span,
      button {
        display: block;
        padding: 7px 12px;
        line-height: 1.2;
        color: var(--color-button-font);
        font-size: 13px;
      }
      &.active {
        span {
          background-color: var(--color-button-background-selected);
        }
      }
      button {
        background-color: transparent;
        border: none;
        cursor: pointer;
        outline: none;
        transition: background-color .3s ease;
        &:hover {
          background-color: var(--color-button-background-hover);
        }
        &:active {
          background-color: var(--color-button-background-active);
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


</style>
