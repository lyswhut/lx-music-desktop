<template lang="pug">
  div(:class="$style.toolbar")
    //- img(v-if="icon")
    //- h1 {{title}}
    material-search-input(:class="$style.input")
    div(:class="$style.control")
      button(type="button" :class="$style.min" title="最小化" @click="min")
      //- button(type="button" :class="$style.max" @click="max")
      button(type="button" :class="$style.close" title="关闭" @click="close")
</template>

<script>
import { rendererSend } from 'common/icp'
// import { mapGetters } from 'vuex'
export default {
  // props: {
  //   color: {
  //     type: String,
  //     default: color,
  //   },
  //   icon: {
  //     type: Boolean,
  //     default: false,
  //   },
  // },
  computed: {
    // ...mapGetters(['theme']),
  },
  methods: {
    min() {
      rendererSend('min')
    },
    max() {
      rendererSend('max')
    },
    close() {
      rendererSend('close')
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.toolbar {
  display: flex;
  height: @height-toolbar;
  justify-content: flex-end;
  align-items: center;
  padding-left: 15px;
  -webkit-app-region: drag;
  z-index: 1;
  position: relative;
}
.input {
  -webkit-app-region: no-drag;
}

// img {
//   flex: none;
//   height: 100%;
// }

// h1 {
//   text-align: center;
//   padding: 8px;
//   flex: auto;
//   -webkit-app-region: drag;
//   -webkit-user-select: none;
// }

.control {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
  &:hover {
    button:before {
      opacity: 1;
    }
  }

  button {
    position: relative;
    width: @height-toolbar;
    background: none;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    outline: none;
    padding: 0;
    cursor: pointer;

    &:after {
      content: ' ';
      display: block;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      transition: background-color 0.2s ease-in-out;
    }

    &:before {
      display: block;
      position: absolute;
      opacity: 0;
      transition: opacity @transition-theme;
    }

    &.min:after {
      background-color: @color-minBtn;
    }
    &.max:after {
      background-color: @color-maxBtn;
    }
    &.close:after {
      background-color: @color-closeBtn;
    }

    &.min:hover:after {
      background-color: lighten(@color-minBtn, 10%);
      opacity: 1;
    }
    &.max:hover:after {
      background-color: lighten(@color-maxBtn, 10%);
    }
    &.close:hover:after {
      background-color: lighten(@color-closeBtn, 10%);
    }
  }
}
.min {
  &:before {
    content: ' ';
    width: 8px;
    height: 2px;
    left: @height-toolbar / 2 - 4;
    top: @height-toolbar / 2 - 1;
    background-color: #fff;
  }
}
.close {
  &:before {
    content: '×';
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
    line-height: 1;
    color: #fff;
  }
}
</style>
