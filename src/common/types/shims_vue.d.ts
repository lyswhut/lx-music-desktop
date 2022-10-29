// declare module '*.vue' {
//   import { App } from 'vue'
//   export default App.Component
// }

declare module '*.vue' {
  import { Component } from 'vue'
  const component: Component
  export default component
}
