
export const getNow = typeof performance == 'object' && window.performance.now ? window.performance.now.bind(window.performance) : Date.now.bind(Date)

export class TimeoutTools {
  constructor(thresholdTime = 80) {
    this.nextTick = window.requestAnimationFrame.bind(window)
    this.cancelNextTick = window.cancelAnimationFrame.bind(window)
    this.invokeTime = 0
    this.animationFrameId = null
    this.timeoutId = null
    this.callback = null
    this.thresholdTime = thresholdTime
  }

  run() {
    this.animationFrameId = this.nextTick(() => {
      this.animationFrameId = null
      let diff = this.invokeTime - getNow()
      // console.log('diff', diff)
      if (diff > 0) {
        if (diff < this.thresholdTime) return this.run()
        // console.log('run timeout', diff, diff - this.thresholdTime)
        return this.timeoutId = window.setTimeout(() => {
          this.timeoutId = null
          this.run()
        }, diff - this.thresholdTime)
      }

      // console.log('diff', diff)
      this.callback(diff)
    })
  }

  start(callback = () => {}, timeout = 0) {
    // console.log(timeout)
    this.callback = callback
    this.invokeTime = getNow() + timeout

    this.run()
  }

  clear() {
    if (this.animationFrameId) {
      this.cancelNextTick(this.animationFrameId)
      this.animationFrameId = null
    }
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
}

