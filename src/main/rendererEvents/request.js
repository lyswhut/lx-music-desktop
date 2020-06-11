const request = require('request')

const { mainOn, NAMES: { mainWindow: ipcMainWindowNames } } = require('../../common/ipc')

const tasks = []

mainOn(ipcMainWindowNames.handle_request, (event, options) => {
  // console.log(args)
  if (!options) return
  let index = fetchData(options, (err, resp) => {
    tasks[index] = null
    if (err) {
      console.log(err)
      event.sender.send('response', err.message, null)
      return
    }
    event.sender.send('response', null, resp.body)
  })
  event.returnValue = index
})

mainOn(ipcMainWindowNames.cancel_request, (event, index) => {
  if (index == null) return
  let r = tasks[index]
  if (r == null) return
  r.abort()
  tasks[index] = null
})

const fetchData = (options, callback) => pushTask(tasks, request(options.url, {
  method: options.method,
  headers: options.headers,
  Origin: options.origin,
}, (err, resp) => {
  if (err) return callback(err, null)
  callback(null, resp)
}))

const pushTask = (tasks, newTask) => {
  for (const [index, task] of tasks.entries()) {
    if (task == null) {
      return tasks[index].push(newTask)
    }
  }
}
