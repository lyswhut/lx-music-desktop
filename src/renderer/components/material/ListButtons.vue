<template>
  <div :class="$style.btns">
    <button v-if="playBtn" type="button" :aria-label="$t('list__play')" @contextmenu.capture.stop @click.stop="handleClick('play')">
      <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 287.386 287.386" space="preserve">
        <use xlink:href="#icon-testPlay" />
      </svg>
    </button>
    <button v-if="listAddBtn" type="button" :aria-label="$t('list__add_to')" @contextmenu.capture.stop @click.stop="handleClick('listAdd')">
      <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 42 42" space="preserve">
        <use xlink:href="#icon-addTo" />
      </svg>
    </button>
    <button v-if="downloadBtn && appSetting['download.enable']" type="button" :aria-label="$t('list__download')" @contextmenu.capture.stop @click.stop="handleClick('download')">
      <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 475.078 475.077" space="preserve">
        <use xlink:href="#icon-download" />
      </svg>
    </button>
    <button v-if="startBtn" type="button" :aria-label="$t('list__start')" @contextmenu.capture.stop @click.stop="handleClick('start')">
      <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
        <use xlink:href="#icon-play" />
      </svg>
    </button>
    <button v-if="pauseBtn" type="button" :aria-label="$t('list__pause')" @contextmenu.capture.stop @click.stop="handleClick('pause')">
      <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 1024 1024" space="preserve">
        <use xlink:href="#icon-pause" />
      </svg>
    </button>
    <button v-if="fileBtn" type="button" :aria-label="$t('list__file')" @contextmenu.capture.stop @click.stop="handleClick('file')">
      <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="-61 0 512 512" space="preserve">
        <use xlink:href="#icon-musicFile" />
      </svg>
    </button>
    <button v-if="searchBtn" type="button" :aria-label="$t('list__search')" @contextmenu.capture.stop @click.stop="handleClick('search')">
      <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 30.239 30.239" space="preserve">
        <use xlink:href="#icon-search" />
      </svg>
    </button>
    <button v-if="removeBtn" type="button" :aria-label="$t('list__remove')" @click.stop="handleClick('remove')">
      <svg v-once version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" height="100%" viewBox="0 0 212.982 212.982" space="preserve">
        <use xlink:href="#icon-delete" />
      </svg>
    </button>
  </div>
</template>

<script>
import { appSetting } from '@renderer/store/setting'

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
  emits: ['btn-click'],
  setup() {
    return {
      appSetting,
    }
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
  line-height: 1.2;

  button {
    background-color: transparent;
    border: none;
    border-radius: @form-radius;
    margin-right: 5px;
    cursor: pointer;
    padding: 4px 7px;
    color: var(--color-button-font);
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
      background-color: var(--color-button-background-hover);
    }
    &:active {
      background-color: var(--color-button-background-active);
    }
  }
}

</style>
