<template lang="pug">
div(:class="$style.btns")
  button(type="button" v-if="playBtn" @contextmenu.capture.stop :tips="$t('list__play')" @click.stop="handleClick('play')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 287.386 287.386' space='preserve' v-once)
      use(xlink:href='#icon-testPlay')
  button(type="button" v-if="listAddBtn" @contextmenu.capture.stop :tips="$t('list__add_to')" @click.stop="handleClick('listAdd')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 42 42' space='preserve' v-once)
      use(xlink:href='#icon-addTo')
  button(type="button" v-if="downloadBtn && setting.download.enable" @contextmenu.capture.stop :tips="$t('list__download')" @click.stop="handleClick('download')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 475.078 475.077' space='preserve' v-once)
      use(xlink:href='#icon-download')
  //- button(type="button" :tips="$t('list__add')" v-if="userInfo" @click.stop="handleClick('add')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 42 42' space='preserve')
      use(xlink:href='#icon-addTo')
  button(type="button" v-if="startBtn" @contextmenu.capture.stop :tips="$t('list__start')" @click.stop="handleClick('start')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 170 170' space='preserve' v-once)
      use(xlink:href='#icon-play')
  button(type="button" v-if="pauseBtn" @contextmenu.capture.stop :tips="$t('list__pause')" @click.stop="handleClick('pause')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 277.338 277.338' space='preserve' v-once)
      use(xlink:href='#icon-pause')
  button(type="button" v-if="fileBtn" @contextmenu.capture.stop :tips="$t('list__file')" @click.stop="handleClick('file')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='-61 0 512 512' space='preserve' v-once)
      use(xlink:href='#icon-musicFile')
  button(type="button" v-if="searchBtn" @contextmenu.capture.stop :tips="$t('list__search')" @click.stop="handleClick('search')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 30.239 30.239' space='preserve' v-once)
      use(xlink:href='#icon-search')
  button(type="button" v-if="removeBtn" :tips="$t('list__remove')" @click.stop="handleClick('remove')")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 212.982 212.982' space='preserve' v-once)
      use(xlink:href='#icon-delete')

</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {
    index: {
      type: Number,
      required: true,
    },
    startBtn: {
      type: Boolean,
      default: false,
    },
    pauseBtn: {
      type: Boolean,
      default: false,
    },
    removeBtn: {
      type: Boolean,
      default: false,
    },
    downloadBtn: {
      type: Boolean,
      default: true,
    },
    playBtn: {
      type: Boolean,
      default: true,
    },
    listAddBtn: {
      type: Boolean,
      default: true,
    },
    searchBtn: {
      type: Boolean,
      default: false,
    },
    fileBtn: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters(['setting']),
  },
  methods: {
    handleClick(action) {
      this.$emit('btn-click', { action, index: this.index })
    },
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.btns {
  line-height: 1;

  button {
    background-color: transparent;
    border: none;
    border-radius: @form-radius;
    margin-right: 5px;
    cursor: pointer;
    padding: 4px 7px;
    color: @color-btn;
    outline: none;
    transition: background-color 0.2s ease;
    line-height: 0;
    &:last-child {
      margin-right: 0;
    }

    svg {
      height: 16px;
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
  :global(#root.@{value}) {
    .btns {
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
