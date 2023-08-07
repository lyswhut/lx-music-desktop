const names = {
  init: '',
  request: '',
  response: '',
  openDevTools: '',
  showUpdateAlert: '',
}


for (const key of Object.keys(names)) {
  names[key] = `userApi_${key}`
}

export default names
