<template>
<div :class="[$style.select, {[$style.active]: show}]">
  <div :class="$style.label" ref="dom_btn" @click="handleShow">{{modelValue ? itemName ? list.find(l => l.id == modelValue).name : modelValue : ''}}</div>
  <ul :class="$style.list">
    <li v-for="(item, index) in list" :key="index" @click="handleClick(itemKey ? item[itemKey] : item)">{{itemName ? item[itemName] : item}}</li>
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
    }
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
      if (e && e.target == this.$refs.dom_btn) return
      setTimeout(() => {
        this.show = false
      }, 50)
    },
    handleClick(item) {
      if (item === this.modelValue) return
      this.$emit('update:modelValue', item)
      this.$emit('change', item)
    },
    handleShow() {
      this.show = !this.show
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.select {
  font-size: 12px;
  position: relative;

  &.active {
    .list {
      transform: scaleY(1);
      opacity: 1;
    }
  }
}

.label {
  padding: 8px 15px;
  // background-color: @color-btn-background;
  transition: background-color @transition-theme;
  border-top: 2px solid @color-tab-border-bottom;
  border-left: 2px solid @color-tab-border-bottom;
  box-sizing: border-box;
  text-align: center;
  border-top-left-radius: @radius-border;
  color: @color-btn;
  cursor: pointer;
  .mixin-ellipsis-1;

  &:hover {
    background-color: @color-btn-hover;
  }
  &:active {
    background-color: @color-btn-active;
  }
}

.list {
  position: absolute;
  width: 100%;
  top: 100%;
  left: 0;
  border-bottom: 2px solid @color-tab-border-bottom;
  border-left: 2px solid @color-tab-border-bottom;
  border-bottom-left-radius: @radius-border;
  background-color: @color-theme_2-background_2;
  opacity: 0;
  transform: scaleY(0);
  transform-origin: 0 0 0;
  transition: .25s ease;
  transition-property: transform, opacity;
  z-index: 10;

  li {
    cursor: pointer;
    padding: 8px 15px;
    // color: @color-btn;
    text-align: center;
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
  }
}


each(@themes, {
  :global(#root.@{value}) {
    .label {
      border-top-color: ~'@{color-@{value}-tab-border-bottom}';
      border-left-color: ~'@{color-@{value}-tab-border-bottom}';
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
      border-left-color: ~'@{color-@{value}-tab-border-bottom}';
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
      }
    }
  }
})

</style>
