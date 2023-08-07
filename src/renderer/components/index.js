import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'

const requireComponent = import.meta.glob(['./**/*.vue', '!./**/components/**/*.vue'], { eager: true })
const vueFileRxp = /\.vue$/
const vueIndexFileRxp = /\/index\.vue$/


export default app => {
  Object.entries(requireComponent).forEach(([path, module]) => {
    path = path.replace(/^\.\//, '')
    let fileName = vueIndexFileRxp.test(path)
      ? path.replace(vueIndexFileRxp, '')
      : path.replace(vueFileRxp, '')

    let componentName = upperFirst(camelCase(fileName))

    // console.log(componentName)

    app.component(componentName, module.default)
  })
}
