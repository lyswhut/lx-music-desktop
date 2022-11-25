import {
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  nextTick,
  onMounted,
  onBeforeUnmount,
  toRaw,
  useCssModule,
  toRef,
  toRefs,
  shallowRef,
  unref,
  markRaw,
  ComputedRef,
  Ref,
  ShallowRef,
  defineProps,
  defineEmits,
  defineComponent,
  shallowReactive,
  defineExpose,
  withDefaults,
} from 'vue'
// import { useStore } from 'vuex'

// export const useState = name => {
//   const store = useStore()
//   return store.state[name]
// }
// export const useGetter = (...names) => {
//   const store = useStore()
//   return store.getters[names.join('/')]
// }
// export const useRefGetter = (...names) => {
//   const store = useStore()
//   return computed(() => store.getters[names.join('/')])
// }

// export const useAction = (...names) => {
//   const store = useStore()
//   return params => {
//     return store.dispatch(names.join('/'), params)
//   }
// }
// export const useCommit = (...names) => {
//   const store = useStore()
//   return params => {
//     return store.commit(names.join('/'), params)
//   }
// }

export const markRawList = <T extends any[]>(list: T) => {
  for (const item of list) {
    markRaw(item)
  }
  return list
}

export {
  nextTick,
  onBeforeUnmount,
  ref,
  toRaw,
  reactive,
  watch,
  watchEffect,
  computed,
  useCssModule,
  toRef,
  toRefs,
  shallowRef,
  unref,
  onMounted,
  markRaw,
  defineProps,
  defineEmits,
  defineComponent,
  shallowReactive,
  defineExpose,
  withDefaults,
}

export type {
  ComputedRef,
  Ref,
  ShallowRef,
}
