// https://vuex.vuejs.org/en/modules.html

const requireModule = require.context('./', true, /\.js$/)
const modules = {}

requireModule.keys().forEach(fileName => {
  if (fileName === './index.js') return
  const path = fileName.replace(/(\.\/|\.js)/g, '')

  if (/\//.test(path)) {
    // Replace ./ and .js
    const [moduleName, imported] = path.split('/')

    if (!modules[moduleName]) {
      modules[moduleName] = {
        namespaced: true,
      }
    }

    modules[moduleName][imported] = requireModule(fileName).default
  } else {
    modules[path] = requireModule(fileName).default
  }
})

export default modules
