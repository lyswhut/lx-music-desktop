<template>
<div :class="$style.menu">
  <ul :class="$style.list">
    <li v-for="item in menus" :key="item.to">
      <router-link :class="$style.link" :active-class="$style.active" :to="item.to" :tips="item.tips">
        <div :class="$style.icon">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" :viewBox="item.iconSize" space="preserve">
            <use :xlink:href="item.icon"></use>
          </svg>
        </div>
      </router-link>
    </li>
  </ul>
</div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'Nav',
  computed: {
    ...mapGetters(['setting']),
    menus() {
      return [
        {
          to: 'search',
          tips: this.$t('search'),
          icon: '#icon-search-2',
          iconSize: '0 0 425.2 425.2',
          enable: true,
        },
        {
          to: 'songList',
          tips: this.$t('song_list'),
          icon: '#icon-album',
          iconSize: '0 0 425.2 425.2',
          enable: true,
        },
        {
          to: 'leaderboard',
          tips: this.$t('leaderboard'),
          icon: '#icon-leaderboard',
          iconSize: '0 0 425.22 425.2',
          enable: true,
        },
        {
          to: 'list',
          tips: this.$t('my_list'),
          icon: '#icon-love',
          iconSize: '0 0 444.87 391.18',
          enable: true,
        },
        {
          to: 'download',
          tips: this.$t('download'),
          icon: '#icon-download-2',
          iconSize: '0 0 425.2 425.2',
          enable: this.setting.download.enable,
        },
        {
          to: 'setting',
          tips: this.$t('setting'),
          icon: '#icon-setting',
          iconSize: '0 0 493.23 436.47',
          enable: true,
        },
      ].filter(m => m.enable)
    },
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.menu {
  flex: auto;
  // &.controlBtnLeft {
  //   display: flex;
  //   flex-flow: column nowrap;
  //   justify-content: center;
  //   padding-bottom: @control-btn-height;
  // }
  // padding: 5px;
}
.list {
  -webkit-app-region: no-drag;
  // margin-bottom: 15px;
  &:last-child {
    margin-bottom: 0;
  }
  // dt {
  //   padding-left: 5px;
  //   font-size: 11px;
  //   transition: @transition-theme;
  //   transition-property: color;
  //   color: @color-theme-font-label;
  //   .mixin-ellipsis-1;
  // }
}
.link {
  display: block;
  box-sizing: border-box;
  text-decoration: none;

  position: relative;
  padding: 18px 3px;
  // margin: 5px 0;
  // border-left: 5px solid transparent;
  transition: @transition-theme;
  transition-property: color;
  color: @color-theme-font !important;
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

.icon {
  // margin-bottom: 5px;
  &> svg {
    width: 32%;
  }
}


each(@themes, {
  :global(#root.@{value}) {
    .link {
      color: ~'@{color-@{value}-theme-font}' !important;
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
})
</style>
