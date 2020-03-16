<template lang="pug">
transition(enter-active-class="animated-fast zoomIn" leave-active-class="animated zoomOut")
  div(:class="$style.btns" v-show="show")
    button(type="button" v-if="playBtn" :title="$t('material.flow_btn.play')" @click.stop="handleClick('play')")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 287.386 287.386' space='preserve')
        use(xlink:href='#icon-testPlay')
    button(type="button" v-if="addBtn" :title="$t('material.flow_btn.play')" @click.stop="handleClick('add')")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 42 42' space='preserve')
        use(xlink:href='#icon-addTo')
    button(type="button" v-if="downloadBtn" :title="$t('material.flow_btn.download')" @click.stop="handleClick('download')")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 475.078 475.077' space='preserve')
        use(xlink:href='#icon-download')
    button(type="button" v-if="startBtn" :title="$t('material.flow_btn.start')" @click.stop="handleClick('start')")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 170 170' space='preserve')
        use(xlink:href='#icon-play')
    button(type="button" v-if="pauseBtn" :title="$t('material.flow_btn.pause')" @click.stop="handleClick('pause')")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 277.338 277.338' space='preserve')
        use(xlink:href='#icon-pause')
    button(type="button" v-if="removeBtn" :title="$t('material.flow_btn.remove')" @click.stop="handleClick('remove')")
      svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 212.982 212.982' space='preserve')
        use(xlink:href='#icon-delete')

</template>

<script>

export default {
  props: {
    removeBtn: {
      type: Boolean,
      default: true,
    },
    startBtn: {
      type: Boolean,
      default: false,
    },
    pauseBtn: {
      type: Boolean,
      default: false,
    },
    downloadBtn: {
      type: Boolean,
      default: true,
    },
    addBtn: {
      type: Boolean,
      default: true,
    },
    playBtn: {
      type: Boolean,
      default: true,
    },
    show: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    handleClick(action) {
      this.$emit('btn-click', action)
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.btns {
  position: fixed;
  bottom: 80px;
  right: 30px;
  background-color: @color-search-form-background;
  border-radius: 5px;
  // padding: 3px 5px;
  box-shadow: 0 1px 5px 0 rgba(0,0,0,.2);
  button {
    background-color: transparent;
    border: none;
    border-radius: @form-radius;
    margin-right: 2px;
    cursor: pointer;
    padding: 6px 10px;
    color: @color-btn;
    outline: none;
    transition: background-color 0.2s ease;
    line-height: 0;
    &:last-child {
      margin-right: 0;
    }

    svg {
      width: 18px;
    }

    &:hover {
      background-color: @color-theme_2-hover;
    }
    &:active {
      background-color: @color-theme_2-active;
    }
  }
}

each(@themes, {
  :global(#container.@{value}) {
    .btns {
      background-color: ~'@{color-@{value}-search-form-background}';
      button {
        color: ~'@{color-@{value}-btn}';
        &:hover {
          background-color: ~'@{color-@{value}-theme_2-hover}';
        }
        &:active {
          background-color: ~'@{color-@{value}-theme_2-active}';
        }
      }
    }
  }
})
</style>
