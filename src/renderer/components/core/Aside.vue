<template lang="pug">
div(:class="$style.aside")
  div(:class="$style.controlBtn" v-if="setting.controlBtnPosition == 'left'")
    button(type="button" :class="$style.close" :tips="$t('core.toolbar.close')" @click="close")
      svg(:class="$style.controlBtniIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
        use(xlink:href='#icon-window-close')
    button(type="button" :class="$style.min" :tips="$t('core.toolbar.min')" @click="min")
      svg(:class="$style.controlBtniIcon" version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' viewBox='0 0 24 24' space='preserve')
        use(xlink:href='#icon-window-minimize')

  div(:class="['animated', logoAnimate, $style.logo]" v-else) ^_^
    //- svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' height='100%' viewBox='0 0 127 61' space='preserve')
      use(xlink:href='#icon-logo')

  div(:class="$style.menu")
    dl
      //- dt {{$t('core.aside.online_music')}}
      dd
        router-link(:active-class="$style.active" to="search" :tips="$t('core.aside.search')")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 425.2 425.2' space='preserve')
              use(xlink:href='#icon-search-2')
      dd
        router-link(:active-class="$style.active" to="songList" :tips="$t('core.aside.song_list')")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 425.2 425.2' space='preserve')
              use(xlink:href='#icon-album')
          //- span {{$t('core.aside.song_list')}}
      dd
        router-link(:active-class="$style.active" to="leaderboard" :tips="$t('core.aside.leaderboard')")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 425.22 425.2' space='preserve')
              use(xlink:href='#icon-leaderboard')
          //- span {{$t('core.aside.leaderboard')}}
    dl
      //- dt {{$t('core.aside.my_music')}}
      dd
        router-link(:active-class="$style.active" :tips="$t('core.aside.my_list')" :to="`list?id=${setting.list.prevSelectListId || defaultList.id}`")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 444.87 391.18' space='preserve')
              use(xlink:href='#icon-love')
    dl
      //- dt {{$t('core.aside.other')}}
      dd(v-if="setting.download.enable")
        router-link(:active-class="$style.active" to="download" :tips="$t('core.aside.download')")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 425.2 425.2' space='preserve')
              use(xlink:href='#icon-download-2')
          //- span {{$t('core.aside.download')}}
      dd
        router-link(:active-class="$style.active" to="setting" :tips="$t('core.aside.setting')")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 493.23 436.47' space='preserve')
              use(xlink:href='#icon-setting')
          //- span {{$t('core.aside.setting')}}
</template>

<script>
import { mapGetters } from 'vuex'
import { base as eventBaseName } from '../../event/names'
// import { getRandom } from '../../utils'
export default {
  data() {
    return {
      active: 'search',
      animates: [
        'bounce',
        // 'flash',
        // 'pulse',
        'rubberBand',
        // 'shake',
        // 'headShake',
        'swing',
        'tada',
        // 'wobble',
        'jello',
        // 'heartBeat',
      ],
      logoAnimate: '',
    }
  },
  computed: {
    ...mapGetters(['setting']),
    ...mapGetters('list', ['defaultList']),
  },
  // mounted() {
  //   this.logoAnimate = this.animates[getRandom(0, this.animates.length)]
  // },
  methods: {
    // handleMouseEnter() {
    //   console.log('object')
    //   this.logoAnimate = this.animates[getRandom(0, this.animates.length)]
    // },
    min() {
      window.eventHub.$emit(eventBaseName.min)
    },
    max() {
      window.eventHub.$emit(eventBaseName.max)
    },
    close() {
      window.eventHub.$emit(eventBaseName.close)
    },
  },
}
</script>


<style lang="less" module>
@import '../../assets/styles/layout.less';

.aside {
  // box-shadow: 0 0 5px rgba(0, 0, 0, .3);
  transition: @transition-theme;
  transition-property: background-color;
  background-color: @color-theme-sidebar;
  // background-color: @color-aside-background;
  // border-right: 2px solid @color-theme;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  display: flex;
  flex-flow: column nowrap;
}

@control-btn-width: @height-toolbar * .26;
@control-btn-height: 6%;
.controlBtn {
  box-sizing: border-box;
  padding: 0 7px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  width: 100%;
  height: @control-btn-height;
  -webkit-app-region: no-drag;
  opacity: .5;
  transition: opacity @transition-theme;
  &:hover {
    opacity: .8;
    .controlBtniIcon {
      opacity: 1;
    }
  }

  button {
    position: relative;
    width: @control-btn-width;
    height: @control-btn-width;
    background: none;
    border: none;
    display: flex;
    // justify-content: center;
    // align-items: center;
    outline: none;
    padding: 1px;
    cursor: pointer;
    border-radius: 50%;
    color: @color-theme_2;

    &.min {
      background-color: @color-minBtn;
    }
    &.max {
      background-color: @color-maxBtn;
    }
    &.close {
      background-color: @color-closeBtn;
    }
  }
}
.controlBtniIcon {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.logo {
  box-sizing: border-box;
  padding: 0 13%;
  height: 50px;
  color: @color-theme-font;
  flex: none;
  text-align: center;
  line-height: 50px;
  font-weight: bold;
  // -webkit-app-region: no-drag;
}

.menu {
  flex: auto;
  // &.controlBtnLeft {
  //   display: flex;
  //   flex-flow: column nowrap;
  //   justify-content: center;
  //   padding-bottom: @control-btn-height;
  // }
  // padding: 5px;
  dl {
    -webkit-app-region: no-drag;
    // margin-bottom: 15px;
    &:last-child {
      margin-bottom: 0;
    }
    dt {
      padding-left: 5px;
      font-size: 11px;
      transition: @transition-theme;
      transition-property: color;
      color: @color-theme-font-label;
      .mixin-ellipsis-1;
    }
    dd a {
      display: block;
      box-sizing: border-box;
      text-decoration: none;

      position: relative;
      padding: 18px 3px;
      // margin: 5px 0;
      // border-left: 5px solid transparent;
      transition: @transition-theme;
      transition-property: color;
      color: @color-theme-font;
      cursor: pointer;
      font-size: 11.5px;
      text-align: center;
      outline: none;

      transition: background-color 0.3s ease;
      // border-radius: @radius-border;
      .mixin-ellipsis-1;

      &.active {
        // border-left-color: @color-theme-active;
        background-color: @color-theme-active;
      }

      &:hover:not(.active) {
        background-color: @color-theme-hover;
      }
      &:hover:not(.active) {
        background-color: @color-theme-active;
      }
    }
  }
}

.icon {
  // margin-bottom: 5px;
  &> svg {
    width: 32%;
  }
}


each(@themes, {
  :global(#container.@{value}) {
    .aside {
      background-color: ~'@{color-@{value}-theme-sidebar}';
    }
    .controlBtn {
      button {
        color: ~'@{color-@{value}-theme_2}';

        &.min {
          background-color: ~'@{color-@{value}-minBtn}';
        }
        &.max {
          background-color: ~'@{color-@{value}-maxBtn}';
        }
        &.close {
          background-color: ~'@{color-@{value}-closeBtn}';
        }
      }
    }
    .logo {
      color: ~'@{color-@{value}-theme-font}';
    }
    .menu {
      dl {
        dt {
          color: ~'@{color-@{value}-theme-font-label}';
        }
        dd a {
          color: ~'@{color-@{value}-theme-font}';
          &.active {
            background-color: ~'@{color-@{value}-theme-active}';
          }
          &:hover:not(.active) {
            background-color: ~'@{color-@{value}-theme-hover}';
          }
          &:active:not(.active) {
            background-color: ~'@{color-@{value}-theme-active}';
          }
        }
      }
    }
  }
})

</style>
