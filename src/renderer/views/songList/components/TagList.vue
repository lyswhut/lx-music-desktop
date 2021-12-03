<template lang="pug">
div(:class="[$style.tagList, show ? $style.active : '']")
  div(:class="$style.label" ref="dom_btn" @click="handleShow")
    span {{modelValue.name}}
    div(:class="$style.icon")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 451.847 451.847' space='preserve')
        use(xlink:href='#icon-down')
  div.scroll(:class="$style.list" :style="{ width: listWidth + 'PX' }" @click.stop ref="dom_list")
    div(:class="$style.tag" @click="handleClick(null)") {{$t('default')}}
    dl(v-for="type in list")
      dt(:class="$style.type") {{type.name}}
      dd(:class="$style.tag" v-for="tag in type.list" @click="handleClick(tag)") {{tag.name}}
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  props: {
    list: {
      type: Array,
      default() {
        return []
      },
    },
    listWidth: {
      type: Number,
      default: 645,
    },
    modelValue: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      show: false,
    }
  },
  computed: {
    ...mapGetters(['setting']),
  },
  mounted() {
    document.addEventListener('click', this.handleHide)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleHide)
  },
  methods: {
    handleHide(e) {
      // if (e && e.target.parentNode != this.$refs.dom_list && this.show) return this.show = false
      // console.log(this.$refs)
      if (e && (e.target == this.$refs.dom_btn || this.$refs.dom_btn.contains(e.target))) return
      setTimeout(() => {
        this.show = false
      }, 50)
    },
    handleClick(item) {
      if (!item) {
        item = {
          name: this.$t('default'),
          id: null,
        }
      }
      if (item.id === this.modelValue.id) return this.handleShow()
      this.$emit('update:modelValue', item)
      this.$emit('change', item)
      this.handleShow()
    },
    handleShow() {
      this.show = !this.show
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.tag-list {
  font-size: 12px;
  position: relative;

  &.active {
    .label {
      .icon {
        svg{
          transform: rotate(180deg);
        }
      }
    }
    .list {
      opacity: 1;
      transform: scaleY(1);
    }
  }
}

.label {
  padding: 8px 15px;
  // background-color: @color-btn-background;
  transition: background-color @transition-theme;
  border-top: 2px solid @color-tab-border-bottom;
  // border-left: 2px solid @color-tab-border-bottom;
  box-sizing: border-box;
  text-align: center;
  // border-top-left-radius: 3px;
  color: @color-btn;
  cursor: pointer;

  display: flex;

  span {
    flex: auto;
  }
  .icon {
    flex: none;
    margin-left: 7px;
    line-height: 0;
    svg {
      width: .9em;
      transition: transform .2s ease;
      transform: rotate(0);
    }
  }

  &:hover {
    background-color: @color-btn-hover;
  }
  &:active {
    background-color: @color-btn-active;
  }
}

.list {
  position: absolute;
  top: 100%;
  width: 645px;
  left: 0;
  border-bottom: 2px solid @color-tab-border-bottom;
  border-right: 2px solid @color-tab-border-bottom;
  border-bottom-right-radius: 5px;
  background-color: @color-theme_2-background_2;
  opacity: 0;
  transform: scaleY(0);
  overflow-y: auto;
  transform-origin: 0 0 0;
  max-height: 250px;
  transition: .25s ease;
  transition-property: transform, opacity;
  z-index: 10;
  padding: 10px;
  box-sizing: border-box;

  li {
    cursor: pointer;
    padding: 8px 15px;
    // color: @color-btn;
    text-align: center;
    outline: none;
    transition: background-color @transition-theme;
    background-color: @color-btn-background;
    box-sizing: border-box;

    &:hover {
      background-color: @color-btn-hover;
    }
    &:active {
      background-color: @color-btn-active;
    }
  }
}

.type {
  padding-top: 10px;
  padding-bottom: 3px;
  color: @color-theme_2-font-label;
}

.tag {
  display: inline-block;
  margin: 5px;
  background-color: @color-btn-background;
  padding: 8px 10px;
  border-radius: @radius-progress-border;
  transition: background-color @transition-theme;
  cursor: pointer;
  &:hover {
    background-color: @color-btn-hover;
  }
  &:active {
    background-color: @color-btn-active;
  }
}


each(@themes, {
  :global(#root.@{value}) {
    .label {
      border-top-color: ~'@{color-@{value}-tab-border-bottom}';
      // border-left-color: ~'@{color-@{value}-tab-border-bottom}';
      color: ~'@{color-@{value}-btn}';
      &:hover {
        background-color: ~'@{color-@{value}-btn-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-btn-active}';
      }
    }

    .list {
      border-bottom-color: ~'@{color-@{value}-tab-border-bottom}';
      border-right-color: ~'@{color-@{value}-tab-border-bottom}';
      background-color: ~'@{color-@{value}-theme_2-background_2}';
      // border-left-color: ~'@{color-@{value}-tab-border-bottom}';
      li {
        // color: ~'@{color-@{value}-btn}';
        background-color: ~'@{color-@{value}-btn-background}';
        &:hover {
          background-color: ~'@{color-@{value}-btn-hover}';
        }
        &:active {
          background-color: ~'@{color-@{value}-btn-active}';
        }
      }
    }

    .tag {
      background-color: ~'@{color-@{value}-btn-background}';
      &:hover {
        background-color: ~'@{color-@{value}-btn-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-btn-active}';
      }
    }

    .type {
      color: ~'@{color-@{value}-theme_2-font-label}';
    }
  }
})

</style>
