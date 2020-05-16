<template lang="pug">
div(:class="$style.aside")
  div(:class="['animated', logoAnimate, $style.logo]") L X
    //- svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' height='100%' viewBox='0 0 127 61' space='preserve')
      use(xlink:href='#icon-logo')

  div(:class="$style.menu")
    dl
      //- dt {{$t('core.aside.online_music')}}
      dd
        router-link(:active-class="$style.active" to="search" :title="$t('core.aside.search')")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 801.99 811.98' space='preserve')
              use(xlink:href='#icon-search-2')
      dd
        router-link(:active-class="$style.active" to="songList" :title="$t('core.aside.song_list')")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 739.96 763.59' space='preserve')
              use(xlink:href='#icon-album')
          //- span {{$t('core.aside.song_list')}}
      dd
        router-link(:active-class="$style.active" to="leaderboard" :title="$t('core.aside.leaderboard')")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 819.1 819.38' space='preserve')
              use(xlink:href='#icon-leaderboard')
          //- span {{$t('core.aside.leaderboard')}}
    dl
      //- dt {{$t('core.aside.my_music')}}
      dd
        router-link(:active-class="$style.active" :title="$t('core.aside.my_list')" :to="`list?id=${setting.list.prevSelectListId || defaultList.id}`")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 830.33 740.22' space='preserve')
              use(xlink:href='#icon-love')
    dl
      //- dt {{$t('core.aside.other')}}
      dd
        router-link(:active-class="$style.active" to="download" :title="$t('core.aside.download')")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 798.85 718.96' space='preserve')
              use(xlink:href='#icon-download-2')
          //- span {{$t('core.aside.download')}}
      dd
        router-link(:active-class="$style.active" to="setting" :title="$t('core.aside.setting')")
          div(:class="$style.icon")
            svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' viewBox='0 0 854.85 775.41' space='preserve')
              use(xlink:href='#icon-setting')
          //- span {{$t('core.aside.setting')}}
</template>

<script>
import { mapGetters } from 'vuex'
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
  // methods: {
  //   handleMouseEnter() {
  //     console.log('object')
  //     this.logoAnimate = this.animates[getRandom(0, this.animates.length)]
  //   },
  // },
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
:global(.nd) {
  .aside {
    -webkit-app-region: no-drag;
  }
}
.logo {
  box-sizing: border-box;
  padding: 0 13%;
  height: 50px;
  color: @color-theme-font;
  flex: none;
  text-align: center;
  line-height: 50px;
  // -webkit-app-region: no-drag;
}

.menu {
  flex: auto;
  // display: flex;
  // flex-flow: column nowrap;
  // justify-content: center;
  // padding-bottom: 50px;
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
