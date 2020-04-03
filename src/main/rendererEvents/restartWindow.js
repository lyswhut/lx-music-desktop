const { mainOn } = require('../../common/ipc')


mainOn('restartWindow', (event, name) => {
  console.log(name)
  switch (name) {
    case 'main':
    default:

      break
  }
})

