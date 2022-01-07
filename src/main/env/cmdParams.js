const urlSchemeRxp = /^lxmusic:\/\//

const parseEnv = () => {
  const params = {}
  const rx = /^-\w+/
  for (let param of process.argv) {
    if (urlSchemeRxp.test(param)) {
      global.envParams.deeplink = param
    }

    if (!rx.test(param)) continue
    param = param.substring(1)
    let index = param.indexOf('=')
    if (index < 0) {
      params[param] = true
    } else {
      params[param.substring(0, index)] = param.substring(index + 1)
    }
  }
  return params
}

global.envParams.cmdParams = parseEnv()
