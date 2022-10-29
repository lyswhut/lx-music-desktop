// import mitt from 'mitt'
// import type { Emitter } from 'mitt'

export default class Event {
  listeners: Map<string, Array<(...args: any[]) => any>>
  constructor() {
    this.listeners = new Map()
  }

  on(eventName: string, listener: (...args: any[]) => any) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) this.listeners.set(eventName, targetListeners = [])
    targetListeners.push(listener)
  }

  off(eventName: string, listener: (...args: any[]) => any) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) return
    const index = targetListeners.indexOf(listener)
    if (index < 0) return
    targetListeners.splice(index, 1)
  }

  emit(eventName: string, ...args: any[]) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) return
    for (const listener of targetListeners) {
      listener(...args)
    }
  }

  offAll(eventName: string) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) return
    this.listeners.delete(eventName)
  }
}

// export class App_EVENT {
//   listeners: Map<string, Array<() => void>>
//   constructor() {
//     this.listeners = new Map()
//   }

//   on(eventName: string, listener: () => void) {
//     let targetListeners = this.listeners.get(eventName)
//     if (targetListeners) this.listeners.set(eventName, targetListeners = [])
//     targetListeners!.push(listener)
//   }

//   off(eventName: string, listener: () => void) {

//   }
// }

