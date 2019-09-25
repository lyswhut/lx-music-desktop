<template lang="pug">
transition(enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut")
  div(:class="$style.modal" v-show="show" @click="bgClose && close()")
    transition(:enter-active-class="inClass"
      :leave-active-class="outClass")
      div(:class="$style.content" v-show="show" @click.stop)
        header(:class="$style.header")
          button(type="button" @click="close")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' height='100%' viewBox='0 0 212.982 212.982' space='preserve')
              use(xlink:href='#icon-delete')
        slot
</template>

<script>
import { getRandom } from '../../utils'
import { mapGetters } from 'vuex'
export default {
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    bgClose: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      animateIn: [
        'flipInX',
        'flipInY',
        'fadeIn',
        'bounceIn',
        'lightSpeedIn',
        'rotateInDownLeft',
        'rotateInDownRight',
        'rotateInUpLeft',
        'rotateInUpRight',
        'rollIn',
        'zoomIn',
        'zoomInDown',
        'zoomInLeft',
        'zoomInRight',
        'zoomInUp',
        'slideInDown',
        'slideInLeft',
        'slideInRight',
        'slideInUp',
      ],
      animateOut: [
        'flipOutX',
        'flipOutY',
        'fadeOut',
        'bounceOut',
        'lightSpeedOut',
        'rotateOutDownLeft',
        'rotateOutDownRight',
        'rotateOutUpLeft',
        'rotateOutUpRight',
        'rollOut',
        'zoomOut',
        'zoomOutDown',
        'zoomOutLeft',
        'zoomOutRight',
        'zoomOutUp',
        'slideOutDown',
        'slideOutLeft',
        'slideOutRight',
        'slideOutUp',
        'hinge',
      ],
      inClass: 'animated flipInX',
      outClass: 'animated flipOutX',
      unwatchFn: null,
    }
  },
  computed: {
    ...mapGetters(['setting']),
  },
  watch: {
    'setting.randomAnimate': {
      handler(n) {
        if (n) {
          this.unwatchFn = this.$watch('show', function(n) {
            if (n) {
              this.inClass = 'animated ' + this.animateIn[getRandom(0, this.animateIn.length)]
              this.outClass = 'animated ' + this.animateOut[getRandom(0, this.animateOut.length)]
            }
          })
        } else {
          this.unwatchFn && this.unwatchFn()
        }
      },
      immediate: true,
    },
  },
  mounted() {
  },
  methods: {
    close() {
      this.$emit('close')
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.modal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .3);
  display: grid;
  align-items: center;
  justify-items: center;
  z-index: 99;
}

.content {
  border-radius: 5px;
  box-shadow: 0 0 3px rgba(0, 0, 0, .3);
  overflow: hidden;
  max-height: 70%;
  max-width: 70%;
  position: relative;
  display: flex;
  flex-flow: column nowrap;

  > * {
    background-color: @color-theme_2-background_2;
  }
}

.header {
  flex: none;
  background-color: @color-theme;
  display: flex;
  justify-content: flex-end;

  button {
    border: none;
    cursor: pointer;
    padding: 4px 7px;
    background-color: transparent;
    color: @color-theme-font-label;
    outline: none;
    transition: background-color 0.2s ease;
    line-height: 0;

    svg {
      height: .7em;
    }

    &:hover {
      background-color: @color-theme-hover;
    }
    &:active {
      background-color: @color-theme_2-active;
    }
  }
}

each(@themes, {
  :global(#container.@{value}) {
    .modal {
      background-color: rgba(0, 0, 0, .3);
    }

    .content {
      box-shadow: 0 0 3px rgba(0, 0, 0, .3);
      > * {
        background-color: ~'@{color-@{value}-theme_2-background_2}';
      }
    }

    .header {
      background-color: ~'@{color-@{value}-theme}';
      button {
        color: ~'@{color-@{value}-theme-font-label}';

        &:hover {
          background-color: ~'@{color-@{value}-theme-hover}';
        }
        &:active {
          background-color: ~'@{color-@{value}-theme_2-active}';
        }
      }
    }
  }
})

</style>
