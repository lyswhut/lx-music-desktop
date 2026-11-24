<template>
  <teleport to="#root">
    <ul ref="dom_menu" :class="$style.list" :style="menuStyles" role="menu" :aria-hidden="!modelValue">
      <li
        v-for="item in menus"
        v-show="!item.hide && (item.action == 'download' ? appSetting['download.enable'] : true)"
        :key="item.action"
        :class="$style.listItem"
        role="menuitem"
        :tabindex="modelValue && !item.disabled ? 0 : -1"
        :aria-label="item[itemName]"
        ignore-tip
        :disabled="item.disabled ? true : null"
        @click="menuClick(item)"
        @keydown.enter.prevent="menuClick(item)"
        @keydown.space.prevent="menuClick(item)"
      >
        {{ item[itemName] }}
      </li>
    </ul>
  </teleport>
</template>

<script>
import { computed } from '@common/utils/vueTools'
import useMenuLocation from '@renderer/utils/compositions/useMenuLocation'

import { appSetting } from '@renderer/store/setting'


export default {
  name: 'MenuToolBar',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    xy: {
      type: Object,
      required: true,
    },
    menus: {
      type: Array,
      default() {
        return []
      },
    },
    itemName: {
      type: String,
      default: 'name',
    },
  },
  emits: ['update:modelValue', 'menu-click'],
  setup(props, { emit }) {
    const visible = computed(() => props.modelValue)
    const location = computed(() => props.xy)

    const onHide = () => {
      emit('update:modelValue', false)
      menuClick(null)
    }

    const { dom_menu, menuStyles } = useMenuLocation({
      visible,
      location,
      onHide,
    })

    const menuClick = (item) => {
      if (item?.disabled) return
      emit('menu-click', item)
    }

    return {
      dom_menu,
      menuStyles,
      menuClick,
      appSetting,
    }
  },
}
</script>


<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.list {
  font-size: 12.5px;
  position: absolute;
  opacity: 0;
  transform: scale(0.95);
  transform-origin: 0 0 0;
  padding: 4px;
  transition: .14s ease;
  transition-property: transform, opacity;
  border-radius: var(--ui-radius-md);
  border: 1px solid var(--ui-border-subtle);
  background-color: var(--color-content-background);
  box-shadow: var(--ui-shadow-md);
  z-index: 1000;
  max-height: calc(100vh - 16px);
  overflow-y: auto;
}
.listItem {
  cursor: pointer;
  min-width: 112px;
  line-height: 32px;
  padding: 0 12px;
  border-radius: var(--ui-radius-sm);
  text-align: left;
  outline: none;
  transition: background-color @transition-fast, color @transition-fast, opacity @transition-fast;
  box-sizing: border-box;
  .mixin-ellipsis-1();

  &:hover {
    background-color: var(--ui-surface-active);
    color: var(--color-primary);
  }
  &:active {
    background-color: var(--color-primary-background-active);
  }

  &[disabled] {
    cursor: default;
    opacity: .38;
    &:hover {
      background: none !important;
      color: inherit;
    }
  }
}

</style>
