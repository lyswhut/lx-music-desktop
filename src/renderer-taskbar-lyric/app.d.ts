declare global {
  interface Window {
    ELECTRON_DISABLE_SECURITY_WARNINGS?: string
  }
}

declare module '*.vue' {
  import { type Component } from 'vue'
  const component: Component
  export default component
}

export {}
