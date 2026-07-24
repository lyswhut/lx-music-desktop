<template>
  <div ref="containerRef" :class="[$style.container, $style[`type-${type}`]]">
    <div v-if="type == 'segment'" :class="$style.indicator" :style="indicatorStyle"></div>
    <ul :class="[$style.list, $style[align], $style[`type-${type}`]]" role="tablist">
      <li
        v-for="item in list"
        :key="item[itemKey]" :class="[$style.listItem, {[$style.active]: modelValue == item[itemKey]}]" tabindex="-1" role="tab"
        :aria-label="item[itemLabel]" ignore-tip :aria-selected="modelValue == item[itemKey]" @click="handleToggle(item[itemKey])"
      >
        <span :class="$style.label">{{ item[itemLabel] }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import { computed, ref, onMounted, watch, nextTick } from '@common/utils/vueTools'

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
    type: {
      type: String,
      default: 'line',
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
    const containerRef = ref()
    const indicatorStyle = ref({})

    const activeIndex = computed(() => props.list.findIndex(item => item[props.itemKey] == props.modelValue))

    const updateIndicator = () => {
      void nextTick(() => {
        if (!containerRef.value || props.type !== 'segment') {
          indicatorStyle.value = {}
          return
        }
        const items = containerRef.value.querySelectorAll('li')
        if (!items.length) return
        const idx = Math.max(0, activeIndex.value)
        const activeItem = items[idx]
        if (!activeItem) return
        indicatorStyle.value = {
          width: `${activeItem.offsetWidth}px`,
          transform: `translateX(${activeItem.offsetLeft}px)`,
        }
      })
    }

    const handleToggle = id => {
      if (id == props.modelValue) return
      emit('update:modelValue', id)
      emit('change', id)
    }

    onMounted(updateIndicator)
    watch(() => [props.modelValue, props.list, props.type], updateIndicator, { deep: true, flush: 'post' })

    return {
      containerRef,
      handleToggle,
      indicatorStyle: computed(() => indicatorStyle.value),
    }
  },
}
</script>

<style lang="less" module>
@import '@renderer/assets/styles/layout.less';

.container {
  display: inline-flex;
}

.container.type-segment {
  position: relative;
  display: inline-flex;
  background-color: var(--color-primary-light-400-alpha-700);
  border-radius: 999px;
  padding: 3px;
}

.indicator {
  position: absolute;
  top: 3px;
  left: 0;
  height: calc(100% - 6px);
  background-color: #ffffff;
  border-radius: 999px;
  transition: transform @transition-normal, width @transition-normal;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.list {
  display: flex;
  flex-flow: row nowrap;
  font-size: 12px;
  gap: 25px;
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
      &:after {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
}

.label {
  display: block;
  position: relative;
  padding: 8px 0;
  &:after {
    .mixin-after();
    left: 0;
    bottom: 0;
    width: 100%;
    height: 2px;
    border-radius: 20px;
    background-color: transparent;
    transform: translateY(-4px);
    opacity: 0;
    background-color: var(--color-primary-alpha-300);
    transition: @transition-fast;
    transition-property: transform, opacity;
  }
}

// Pill style (single capsule buttons)
.list.type-pill {
  gap: 4px;
  padding: 0;
}
.type-pill .listItem {
  display: inline-flex;
  align-items: center;
  padding: 6px 18px;
  border-radius: 999px;
  background-color: transparent;
  transition: @transition-fast;
  transition-property: background-color, color, opacity;

  &:hover {
    background-color: var(--color-primary-light-400-alpha-700);
  }

  &.active {
    background-color: var(--color-primary-light-300-alpha-700);
    color: var(--color-primary);

    >.label {
      &:after {
        display: none;
      }
    }
  }
}
.type-pill .label {
  padding: 2px 0;
  font-size: 13px;
  &:after {
    display: none;
  }
}

// Segmented style (iOS style, shared background)
.list.type-segment {
  gap: 0;
  padding: 0;
  position: relative;
  z-index: 1;
}
.type-segment .listItem {
  display: inline-flex;
  align-items: center;
  padding: 3px 12px;
  border-radius: 999px;
  position: relative;
  z-index: 2;
  color: var(--color-text);
  transition: color @transition-fast;

  &:hover {
    color: var(--color-primary);
  }

  &.active {
    color: var(--color-primary);
    font-weight: 500;
    cursor: default;

    >.label {
      &:after {
        display: none;
      }
    }
  }
}
.type-segment .label {
  padding: 1px 0;
  font-size: 12px;
  line-height: 1.4;
  &:after {
    display: none;
  }
}
</style>
