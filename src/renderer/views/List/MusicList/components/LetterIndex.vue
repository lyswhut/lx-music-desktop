<template>
  <div :class="$style.indexBar">
    <div
      v-for="letter in letters"
      :key="letter"
      :class="[$style.item, { [$style.active]: activeLetter === letter }]"
      @click="handleClick(letter)"
      @mouseenter="activeLetter = letter"
      @mouseleave="activeLetter = ''"
    >
      {{ letter }}
    </div>
  </div>
</template>

<script>
import { ref, computed } from '@common/utils/vueTools'
import { groupByFirstLetter } from '../useLetterIndex'

export default {
  props: {
    list: {
      type: Array,
      default: () => [],
    },
    sortState: {
      type: String,
      default: 'none',
    },
  },
  emits: ['scroll-to'],
  setup(props, { emit }) {
    const activeLetter = ref('')

    const letterGroups = computed(() => {
      if (props.sortState === 'none' || !props.list.length) {
        return { letters: [], groups: {} }
      }
      return groupByFirstLetter(props.list)
    })

    const letters = computed(() => {
      const baseLetters = letterGroups.value.letters
      if (props.sortState === 'desc') {
        const hasHash = baseLetters[baseLetters.length - 1] === '#'
        const letterPart = hasHash ? baseLetters.slice(0, -1) : baseLetters
        return hasHash ? [...letterPart.reverse(), '#'] : [...letterPart].reverse()
      }
      return baseLetters
    })

    const handleClick = (letter) => {
      const indices = letterGroups.value.groups[letter]
      if (indices?.length) emit('scroll-to', indices[0])
    }

    return {
      activeLetter,
      letters,
      handleClick,
    }
  },
}
</script>

<style lang="less" module>
.indexBar {
  position: absolute;
  right: 4px;
  top: 0;
  bottom: 0;
  width: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0.6;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}

.item {
  font-size: 11px;
  line-height: 1.2;
  padding: 1px 2px;
  cursor: pointer;
  color: var(--color-font);
  transition: color 0.15s ease, background-color 0.15s ease;
  border-radius: 2px;
  user-select: none;

  &:hover,
  &.active {
    color: var(--color-primary);
    background-color: var(--color-primary-light-600-alpha-100);
  }
}
</style>
