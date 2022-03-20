<template lang="pug">
material-modal(:show="modelValue" bg-close @close="$emit('update:modelValue', false)" teleport="#view")
  main(:class="$style.main")
    h2 {{$t('theme_selector_modal__title')}}
    div.scroll(:class="$style.content")
      div
        h3 {{$t('theme_selector_modal__light_title')}}
        ul(:class="$style.theme")
          li(v-for="theme in themeLights" :key="theme.id" :aria-label="$t('theme_' + theme.className)" @click="currentStting.theme.lightId = theme.id" :class="[theme.className, {[$style.active]: lightId == theme.id}]")
            span
            label {{$t('theme_' + theme.className)}}
      div
        h3 {{$t('theme_selector_modal__dark_title')}}
        ul(:class="$style.theme")
          li(v-for="theme in themeDarks" :key="theme.id" :aria-label="$t('theme_' + theme.className)" @click="currentStting.theme.darkId = theme.id" :class="[theme.className, {[$style.active]: darkId == theme.id}]")
            span
            label {{$t('theme_' + theme.className)}}
    div(:class="$style.note")
      p {{$t('theme_selector_modal__title_tip')}}
</template>

<script>
import { computed } from '@renderer/utils/vueTools'
import { themeLights, themeDarks } from '@renderer/core/share'
import { currentStting } from '../setting'

export default {
  name: 'ThemeSelectorModal',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const lightId = computed(() => {
      return currentStting.value.theme.lightId
    })
    const darkId = computed(() => {
      return currentStting.value.theme.darkId
    })
    return {
      currentStting,
      themeLights,
      themeDarks,
      lightId,
      darkId,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';
.main {
  // padding: 15px;
  // max-width: 400px;
  min-width: 300px;
  min-height: 0;
  // max-height: 100%;
  // overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  min-height: 0;
  h2 {
    flex: none;
    font-size: 16px;
    color: @color-theme_2-font;
    line-height: 1.3;
    text-align: center;
    padding: 15px;
  }
  h3 {
    font-size: 16px;
    color: @color-theme_2-font;
    line-height: 1.3;
    padding-bottom: 15px;
    font-size: 15px;
  }
}
.content {
  flex: auto;
  padding: 15px;
  display: flex;
  flex-flow: column nowrap;
  gap: 15px;
}
.theme {
  display: flex;
  flex-flow: row wrap;
  // padding: 0 15px;

  li {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    cursor: pointer;
    // color: @color-theme;
    margin-right: 30px;
    transition: color .3s ease;
    margin-bottom: 15px;
    width: 56px;

    &:last-child {
      margin-right: 0;
    }

    span {
      display: block;
      width: 36px;
      height: 36px;
      margin-bottom: 5px;
      border: 2px solid transparent;
      padding: 2px;
      transition: border-color .3s ease;
      border-radius: 5px;
      &:after {
        display: block;
        content: ' ';
        width: 100%;
        height: 100%;
        border-radius: @radius-border;
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
      }
    }

    label {
      width: 100%;
      text-align: center;
      height: 1.2em;
      font-size: 14px;
      .mixin-ellipsis-1;
    }

    each(@themes, {
      &:global(.@{value}) {
        span {
          &:after {
            background-color: ~'@{color-@{value}-theme}';
            background-image: ~'@{color-@{value}-theme-bgimg}';
          }
        }
      }
    })
  }
}

.note {
  padding: 8px 15px;
  font-size: 13px;
  line-height: 1.25;
  color: @color-theme_2-font;
  // p {
  //   + p {
  //     margin-top: 5px;
  //   }
  // }
}

each(@themes, {
  .theme {
    li {
      &:global(.@{value}) {
        &.active {
          color: ~'@{color-@{value}-theme}';
          span {
            border-color: ~'@{color-@{value}-theme}';
          }
        }
      }
    }
  }
  .note {
    color: ~'@{color-@{value}-theme_2-font}';
  }
})

</style>
