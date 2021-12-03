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
  onBeforeUpdate,
  onUpdated,
} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export const useState = name => {
  const store = useStore()
  return store.state[name]
}
export const useGetter = (...names) => {
  const store = useStore()
  return store.getters[names.join('/')]
}
export const useRefGetter = (...names) => {
  const store = useStore()
  return computed(() => store.getters[names.join('/')])
}

export const useAction = (...names) => {
  const store = useStore()
  return params => {
    return store.dispatch(names.join('/'), params)
  }
}
export const useCommit = (...names) => {
  const store = useStore()
  return params => {
    return store.commit(names.join('/'), params)
  }
}

export const markRawList = list => {
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
  useRouter,
  useRoute,
  useI18n,
  useCssModule,
  toRef,
  toRefs,
  shallowRef,
  unref,
  onMounted,
  markRaw,
  onBeforeUpdate,
  onUpdated,
}
