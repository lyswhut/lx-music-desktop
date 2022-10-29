
const easeInOutQuad = (t: number, b: number, c: number, d: number): number => {
  t /= d / 2
  if (t < 1) return (c / 2) * t * t + b
  t--
  return (-c / 2) * (t * (t - 2) - 1) + b
}

type Noop = () => void
const noop: Noop = () => {}

const handleScrollY = (element: HTMLElement, to: number, duration = 300, fn = noop): Noop => {
  if (!element) {
    fn()
    return noop
  }
  // @ts-expect-error
  const start = element.scrollTop ?? element.scrollY ?? 0
  let cancel = false
  if (to > start) {
    let maxScrollTop = element.scrollHeight - element.clientHeight
    if (to > maxScrollTop) to = maxScrollTop
  } else if (to < start) {
    if (to < 0) to = 0
  } else {
    fn()
    return noop
  }
  const change = to - start
  const increment = 10
  if (!change) {
    fn()
    return noop
  }

  let currentTime = 0
  let val

  const animateScroll = () => {
    currentTime += increment
    val = Math.trunc(easeInOutQuad(currentTime, start, change, duration))
    if (element.scrollTo) {
      element.scrollTo(0, val)
    } else {
      element.scrollTop = val
    }
    if (currentTime < duration) {
      if (cancel) return fn()
      window.setTimeout(animateScroll, increment)
    } else {
      fn()
    }
  }
  animateScroll()
  return () => {
    cancel = true
  }
}
/**
  * 设置滚动条位置
  * @param {*} element 要设置滚动的容器 dom
  * @param {*} to 滚动的目标位置
  * @param {*} duration 滚动完成时间 ms
  * @param {*} fn 滚动完成后的回调
  * @param {*} delay 延迟执行时间
  */
export const scrollTo = (element: HTMLElement, to: number, duration = 300, fn = () => {}, delay = 0): () => void => {
  let cancelFn: () => void
  let timeout: number | null
  if (delay) {
    let scrollCancelFn: Noop
    cancelFn = () => {
      timeout == null ? scrollCancelFn?.() : clearTimeout(timeout)
    }
    timeout = window.setTimeout(() => {
      timeout = null
      scrollCancelFn = handleScrollY(element, to, duration, fn)
    }, delay)
  } else {
    cancelFn = handleScrollY(element, to, duration, fn) ?? noop
  }
  return cancelFn
}
const handleScrollX = (element: HTMLElement, to: number, duration = 300, fn = () => {}): () => void => {
  if (!element) {
    fn()
    return noop
  }
  // @ts-expect-error
  const start = element.scrollLeft || element.scrollX || 0
  let cancel = false
  if (to > start) {
    let maxScrollLeft = element.scrollWidth - element.clientWidth
    if (to > maxScrollLeft) to = maxScrollLeft
  } else if (to < start) {
    if (to < 0) to = 0
  } else {
    fn()
    return noop
  }
  const change = to - start
  const increment = 10
  if (!change) {
    fn()
    return noop
  }

  let currentTime = 0
  let val

  const animateScroll = () => {
    currentTime += increment
    val = Math.trunc(easeInOutQuad(currentTime, start, change, duration))
    if (element.scrollTo) {
      element.scrollTo(val, 0)
    } else {
      element.scrollLeft = val
    }
    if (currentTime < duration) {
      if (cancel) return fn()
      window.setTimeout(animateScroll, increment)
    } else {
      fn()
    }
  }
  animateScroll()
  return () => {
    cancel = true
  }
}
/**
  * 设置滚动条位置
  * @param {*} element 要设置滚动的容器 dom
  * @param {*} to 滚动的目标位置
  * @param {*} duration 滚动完成时间 ms
  * @param {*} fn 滚动完成后的回调
  * @param {*} delay 延迟执行时间
  */
export const scrollXTo = (element: HTMLElement, to: number, duration = 300, fn = () => {}, delay = 0): () => void => {
  let cancelFn: Noop
  let timeout: number | null
  if (delay) {
    let scrollCancelFn: Noop
    cancelFn = () => {
      timeout == null ? scrollCancelFn?.() : clearTimeout(timeout)
    }
    timeout = window.setTimeout(() => {
      timeout = null
      scrollCancelFn = handleScrollX(element, to, duration, fn)
    }, delay)
  } else {
    cancelFn = handleScrollX(element, to, duration, fn)
  }
  return cancelFn
}

const handleScrollXR = (element: HTMLElement, to: number, duration = 300, fn = () => {}): () => void => {
  if (!element) {
    fn()
    return noop
  }
  // @ts-expect-error
  const start = element.scrollLeft || element.scrollX as number || 0
  let cancel = false
  if (to < start) {
    let maxScrollLeft = -element.scrollWidth + element.clientWidth
    if (to < maxScrollLeft) to = maxScrollLeft
  } else if (to > start) {
    if (to > 0) to = 0
  } else {
    fn()
    return noop
  }

  const change = to - start
  const increment = 10
  if (!change) {
    fn()
    return noop
  }

  let currentTime = 0
  let val

  const animateScroll = () => {
    currentTime += increment
    val = Math.trunc(easeInOutQuad(currentTime, start, change, duration))

    if (element.scrollTo) {
      element.scrollTo(val, 0)
    } else {
      element.scrollLeft = val
    }
    if (currentTime < duration) {
      if (cancel) return fn()
      window.setTimeout(animateScroll, increment)
    } else {
      fn()
    }
  }
  animateScroll()
  return () => {
    cancel = true
  }
}
/**
  * 设置滚动条位置 （writing-mode: vertical-rl 专用）
  * @param element 要设置滚动的容器 dom
  * @param to 滚动的目标位置
  * @param duration 滚动完成时间 ms
  * @param fn 滚动完成后的回调
  * @param delay 延迟执行时间
  */
export const scrollXRTo = (element: HTMLElement, to: number, duration = 300, fn = () => {}, delay = 0): () => void => {
  let cancelFn: Noop
  let timeout: number | null
  if (delay) {
    let scrollCancelFn: Noop
    cancelFn = () => {
      timeout == null ? scrollCancelFn?.() : clearTimeout(timeout)
    }
    timeout = window.setTimeout(() => {
      timeout = null
      scrollCancelFn = handleScrollXR(element, to, duration, fn)
    }, delay)
  } else {
    cancelFn = handleScrollXR(element, to, duration, fn)
  }
  return cancelFn
}


/**
  * 设置标题
  */
let dom_title = document.getElementsByTagName('title')[0]
export const setTitle = (title: string | null) => {
  if (!title) title = '洛雪音乐助手'
  dom_title.innerText = title
}

