<template>
<div class="content" :class="[$style.select, show ? $style.active : '']">
  <div class="label-content" :class="$style.label" ref="dom_btn" @click="handleShow">
    <span class="label">{{label}}</span>
    <div class="icon" :class="$style.icon">
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 451.847 451.847" space="preserve">
        <use xlink:href="#icon-down"></use>
      </svg>
    </div>
  </div>
  <ul class="selection-list scroll" :class="$style.list" :style="listStyles" ref="dom_list">
    <li v-for="(item, index) in list" :key="index" :class="(itemKey ? item[itemKey] : item) == modelValue ? $style.active : null"
      @click="handleClick(item)" :tips="itemName ? item[itemName] : item">{{itemName ? item[itemName] : item}}</li>
  </ul>
</div>
</template>

<script>

export default {
  props: {
    list: {
      type: Array,
      default() {
        return []
      },
    },
    modelValue: {
      type: [String, Number],
    },
    itemName: {
      type: String,
    },
    itemKey: {
      type: String,
    },
  },
  data() {
    return {
      show: false,
      listStyles: {
        transform: 'scaleY(0) translateY(0)',
      },
    }
  },
  mounted() {
    document.addEventListener('click', this.handleHide)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleHide)
  },
  computed: {
    label() {
      if (this.modelValue == null) return ''
      if (this.itemName == null) return this.modelValue
      const item = this.list.find(l => l[this.itemKey] == this.modelValue)
      if (!item) return ''
      return item[this.itemName]
    },
  },
  methods: {
    handleHide(e) {
      // if (e && e.target.parentNode != this.$refs.dom_list && this.show) return this.show = false
      if (e && (e.target == this.$refs.dom_btn || this.$refs.dom_btn.contains(e.target))) return
      this.listStyles.transform = 'scaleY(0) translateY(0)'
      setTimeout(() => {
        this.show = false
      }, 50)
    },
    handleClick(item) {
      // console.log(this.modelValue)
      if (item === this.modelValue) return
      this.$emit('update:modelValue', this.itemKey ? item[this.itemKey] : item)
      this.$emit('change', item)
    },
    handleShow() {
      this.show = true
      this.listStyles.transform = `scaleY(1) translateY(${this.handleGetOffset()}px)`
    },
    handleGetOffset() {
      const listHeight = this.$refs.dom_list.clientHeight
      const dom_select = this.$refs.dom_list.offsetParent
      const dom_container = dom_select.offsetParent
      const containerHeight = dom_container.clientHeight
      if (containerHeight < listHeight) return 0
      const offsetHeight = (dom_container.scrollTop + containerHeight) - (dom_select.offsetTop + listHeight)
      if (offsetHeight > 0) return 0
      return offsetHeight - 5
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

@selection-height: 28px;

.select {
  display: inline-block;
  font-size: 12px;
  position: relative;
  width: 300px;

  &.active {
    .label {
      background-color: @color-btn-background;
    }
    .list {
      opacity: 1;
    }
    .icon {
      svg{
        transform: rotate(180deg);
      }
    }
  }
}

.label {
  background-color: @color-btn-background;
  padding: 0 10px;
  transition: background-color @transition-theme;
  height: @selection-height;
  line-height: 27px;
  box-sizing: border-box;
  color: @color-btn;
  border-radius: @form-radius;
  cursor: pointer;
  display: flex;

  span {
    flex: auto;
    .mixin-ellipsis-1;
  }
  .icon {
    flex: none;
    margin-left: 7px;
    line-height: 0;
    svg {
      width: 1em;
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
  top: 0;
  left: 0;
  width: 100%;
  background-color: @color-theme_2-background_2;
  opacity: 0;
  transform: scaleY(0) translateY(0);
  transform-origin: 0 (@selection-height / 2) 0;
  transition: .25s ease;
  transition-property: transform, opacity;
  z-index: 10;
  border-radius: @form-radius;
  box-shadow: 0 0 4px rgba(0, 0, 0, .15);
  overflow: auto;
  max-height: 200px;

  li {
    cursor: pointer;
    padding: 0 10px;
    line-height: @selection-height;
    // color: @color-btn;
    outline: none;
    transition: background-color @transition-theme;
    background-color: @color-btn-background;
    box-sizing: border-box;
    .mixin-ellipsis-1;

    &:hover {
      background-color: @color-btn-hover;
    }
    &:active {
      background-color: @color-btn-active;
    }
    &.active {
      color: @color-btn;
    }
  }
}


each(@themes, {
  :global(#root.@{value}) {
    .label {
      color: ~'@{color-@{value}-btn}';
      background-color: ~'@{color-@{value}-btn-background}';
      &:hover {
        background-color: ~'@{color-@{value}-btn-hover}';
      }
      &:active {
        background-color: ~'@{color-@{value}-btn-active}';
      }
    }

    .list {
      background-color: ~'@{color-@{value}-theme_2-background_2}';
      li {
        // color: ~'@{color-@{value}-btn}';
        background-color: ~'@{color-@{value}-btn-background}';
        &:hover {
          background-color: ~'@{color-@{value}-btn-hover}';
        }
        &:active {
          background-color: ~'@{color-@{value}-btn-active}';
        }
        &.active {
          color: ~'@{color-@{value}-btn}';
        }
      }
    }
  }
})

</style>
