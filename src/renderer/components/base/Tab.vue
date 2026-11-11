<template>
  <ul :class="[$style.list, $style[align], { [$style.boxed]: variant === 'boxed' }]" role="tablist">
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
    variant: {
      type: String,
      default: 'default',
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
  font-size: 13px;
  gap: 12px;
  padding: 0 15px;

  &.left {
    justify-content: flex-start;
  }
  &.center {
    justify-content: center;
  }
  &.right {
    justify-content: flex-end;
  }

  &.boxed {
    gap: 0;
    padding: 2px;
    background-color: var(--color-primary-light-600);
    border-radius: 7px;
    overflow: visible;
  }
}
.listItem {
  display: block;
  cursor: pointer;
  transition: color @transition-normal;


  &:hover {
    color: var(--color-primary);
  }


  &.active {
    color: var(--color-primary);
    cursor: default;

    >.label {
      font-weight: bold;
    }
  }
}

.label {
  display: block;
  padding: 8px 0;
}

/* boxed 变体样式 */
.boxed {
  .listItem {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3px 12px;
    border-radius: 5px;
    transition: background-color @transition-fast, color @transition-fast;
    margin-right: 2px;

    &:last-child {
      margin-right: 0;
    }

    &:hover {
      color: var(--color-primary-dark-300);
    }

    &.active {
      background-color: #fff;
      color: var(--color-primary-dark-400);
      cursor: default;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
  }

  .label {
    padding: 0;
    font-size: 12px;
  }
}
</style>

