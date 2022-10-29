import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'

const requireComponent = require.context('./', true, /\.vue$/)

const vueFileRxp = /\.vue$/

export default app => {
  requireComponent.keys().forEach(fileName => {
    const filePath = fileName.replace(/^\.\//, '')

    if (!filePath.split('/').every((path, index, arr) => {
      const char = path.charAt(0)
      return vueFileRxp.test(path) || char.toUpperCase() !== char || arr[index + 1] == 'index.vue'
    })) return

    const componentConfig = requireComponent(fileName)

    let componentName = upperFirst(camelCase(filePath.replace(/\.\w+$/, '')))

    if (componentName.endsWith('Index')) componentName = componentName.replace(/Index$/, '')

    app.component(componentName, componentConfig.default || componentConfig)
  })
}
