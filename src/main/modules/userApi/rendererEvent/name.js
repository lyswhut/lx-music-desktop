const names = {
  init: '',
  request: '',
  response: '',
  openDevTools: '',
}


for (const key of Object.keys(names)) {
  names[key] = `userApi_${key}`
}
module.exports = names
