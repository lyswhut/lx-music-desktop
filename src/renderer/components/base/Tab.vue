<template>
  <ul :class="[$style.list, $style[align]]" role="tablist">
    <li
      v-for="item in list"
      :key="item[itemKey]" :class="[$style.listItem, {[$style.active]: modelValue == item[itemKey]}]" tabindex="-1" role="tab"
      :aria-label="item[itemLabel]" ignore-tip :aria-selected="modelValue == item[itemKey]" @click="handleToggle(item[itemKey])"
    >
      <span :class="$style.label">{{ item[itemLabel] }}</span>
    </li>
  </ul>
</template>

<script>

export default {
  props: {
    list: {
      type: Array,
      default() {
        return []
      },
    },
    align: {
      type: String,
      default: 'left',
    },
    itemKey: {
      type: String,
      default: 'id',
    },
    itemLabel: {
      type: String,
      default: 'label',
    },
    modelValue: {
      type: [String, Number],
      default: '',
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const handleToggle = id => {
      if (id == props.modelValue) return
      emit('update:modelValue', id)
      emit('change', id)
    }

    return {
      handleToggle,
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.list {
  display: flex;
  flex-flow: row nowrap;
  font-size: 12.5px;
  gap: 4px;
  padding: 6px 14px;
  align-items: center;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }

  &.left {
    justify-content: flex-start;
  }
  &.center {
    justify-content: center;
  }
  &.right {
    justify-content: flex-end;
  }
}
.listItem {
  display: block;
  flex: none;
  cursor: pointer;
  border-radius: var(--ui-radius-pill);
  color: var(--color-font-label);
  transition: color @transition-fast, background-color @transition-fast;

  &:hover {
    color: var(--color-font);
    background-color: var(--ui-surface-hover);
  }

  &.active {
    color: var(--color-primary);
    font-weight: 600;
    background-color: var(--ui-surface-active);
    cursor: default;

    >.label {
      &:after {
        opacity: 0;
      }
    }
  }
}

.label {
  display: block;
  position: relative;
  padding: 5px 10px;
  white-space: nowrap;
  &:after {
    .mixin-after();
    left: 14px;
    bottom: 2px;
    width: calc(100% - 28px);
    height: 2px;
    border-radius: 20px;
    opacity: 0;
    background-color: var(--color-primary);
    transition: opacity @transition-fast;
  }
}
</style>
