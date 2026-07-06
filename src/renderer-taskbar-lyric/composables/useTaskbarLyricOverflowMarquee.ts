import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties, type Ref, type WatchSource } from 'vue'

interface UseTaskbarLyricOverflowMarqueeOptions {
  text: Ref<string>
  minDuration: number
  pixelsPerSecond: number
  distanceVarName: string
  durationVarName: string
  watchSources?: Array<WatchSource<unknown>>
}

export const useTaskbarLyricOverflowMarquee = ({
  text,
  minDuration,
  pixelsPerSecond,
  distanceVarName,
  durationVarName,
  watchSources = [],
}: UseTaskbarLyricOverflowMarqueeOptions) => {
  const containerRef = ref<HTMLElement | null>(null)
  const measureRef = ref<HTMLElement | null>(null)
  const shouldScroll = ref(false)
  const scrollDistance = ref(0)
  let resizeObserver: ResizeObserver | null = null

  const updateScrollState = () => {
    const containerWidth = containerRef.value?.clientWidth ?? 0
    const contentWidth = measureRef.value?.scrollWidth ?? 0
    const overflowWidth = Math.max(contentWidth - containerWidth, 0)
    shouldScroll.value = overflowWidth > 6
    scrollDistance.value = overflowWidth
  }

  const trackStyle = computed<CSSProperties>(() => {
    const distance = Math.max(scrollDistance.value, 0)
    const gap = 24
    const duration = Math.max(minDuration, distance / pixelsPerSecond)
    return {
      [distanceVarName]: `${distance + gap}px`,
      [durationVarName]: `${duration.toFixed(2)}s`,
    }
  })

  const queueUpdate = () => {
    void nextTick(() => {
      updateScrollState()
    })
  }

  onMounted(() => {
    resizeObserver = new ResizeObserver(updateScrollState)
    if (containerRef.value) resizeObserver.observe(containerRef.value)
    if (measureRef.value) resizeObserver.observe(measureRef.value)
    queueUpdate()
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  watch([text, ...watchSources], queueUpdate)

  return {
    containerRef,
    measureRef,
    shouldScroll,
    trackStyle,
  }
}
