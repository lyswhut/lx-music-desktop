const names = {
  initEnv: '',
  init: '',
  request: '',
  response: '',
  openDevTools: '',
  showUpdateAlert: '',
  getProxy: '',
  proxyUpdate: '',
}


for (const key of Object.keys(names)) {
  names[key] = `userApi_${key}`
}

export default names
