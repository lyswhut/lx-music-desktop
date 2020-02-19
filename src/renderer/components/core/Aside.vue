<template lang="pug">
div(:class="$style.aside")
  div(:class="$style.logo")
    svg(version='1.1' xmlns='http://www.w3.org/2000/svg' xlink='http://www.w3.org/1999/xlink' width='100%' height='100%' viewBox='0 0 127 61' space='preserve')
      use(xlink:href='#icon-logo')

  div(:class="$style.menu")
    dl
      dt {{$t('core.aside.online_music')}}
      dd
        router-link(:active-class="$style.active" to="search") {{$t('core.aside.search')}}
      dd
        router-link(:active-class="$style.active" to="songList") {{$t('core.aside.song_list')}}
      dd
        router-link(:active-class="$style.active" to="leaderboard") {{$t('core.aside.leaderboard')}}
    dl
      dt {{$t('core.aside.my_music')}}
      dd
        router-link(:active-class="($route.query.id === defaultList.id || $route.query.id == '') ? $style.active : ''" :to="`list?id=${defaultList.id || ''}`") {{$t('core.aside.default_list')}}
        router-link(:active-class="$route.query.id === loveList.id ? $style.active : ''" :to="`list?id=${loveList.id}`") {{$t('core.aside.love_list')}}
        router-link(:active-class="$route.query.id === item.id ? $style.active : ''" v-for="item in userList" :to="`list?id=${item._id}`" :key="item._id") {{item.name}}
    dl
      dt {{$t('core.aside.other')}}
      dd
        router-link(:active-class="$style.active" to="download") {{$t('core.aside.download')}}
      dd
        router-link(:active-class="$style.active" to="setting") {{$t('core.aside.setting')}}
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
  },
  data() {
    return {
      active: 'search',
    }
  },
  computed: {
    ...mapGetters('list', ['defaultList', 'loveList', 'userList']),
  },
  methods: {},
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
.logo {
  box-sizing: border-box;
  padding: 12% 13%;
  // height: 120px;
  color: @color-theme-font;
  flex: none;
}

.menu {
  flex: auto;
  padding: 10px;
  dl {
    -webkit-app-region: no-drag;
    margin-bottom: 15px;
    &:last-child {
      margin-bottom: 0;
    }
    dt {
      font-size: 11px;
      transition: @transition-theme;
      transition-property: color;
      color: @color-theme-font-label;
    }
    dd a {
      display: block;
      box-sizing: border-box;
      text-decoration: none;

      position: relative;
      padding: 10px;
      margin: 5px 0;
      // border-left: 5px solid transparent;
      transition: @transition-theme;
      transition-property: color;
      color: @color-theme-font;
      cursor: pointer;
      font-size: 14px;

      transition: background-color 0.3s ease;
      border-radius: 4px;

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
