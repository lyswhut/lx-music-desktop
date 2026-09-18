import { onBeforeUnmount, watch } from '@common/utils/vueTools'
import { useI18n } from '@renderer/plugins/i18n'
import { onUserApiStatus, getUserApiList, importUserApi, removeUserApi, sendUserApiRequest as sendUserApiRequestRemote, userApiRequestCancel, onShowUserApiUpdateAlert } from '@renderer/utils/ipc'
import { openUrl } from '@common/utils/electron'
import { httpFetch } from '@renderer/utils/request'
import { qualityList, userApi } from '@renderer/store'
import { appSetting } from '@renderer/store/setting'
import { dialog } from '@renderer/plugins/Dialog'
import { setUserApi } from '@renderer/core/apiSource'

const sendUserApiRequest: typeof sendUserApiRequestRemote = async(data) => {
  let stop: () => void
  return new Promise<void>((resolve, reject) => {
    stop = watch(() => appSetting['common.apiSource'], () => {
      reject(new Error('source changed'))
    })
    void sendUserApiRequestRemote(data).then(resolve).catch(reject)
  }).finally(() => {
    stop()
  })
}

const MAX_USER_API_SCRIPT_SIZE = 9_000_000
const API_INIT_TIMEOUT = 20_000

const getOnlineUserApiScript = async(url: string) => {
  const request = httpFetch(url, { follow_max: 3 }) as unknown as { promise: Promise<{ body: unknown }> }
  const script = await request.promise.then(resp => String(resp.body ?? ''))
  if (!script) throw new Error(window.i18n.t('user_api_import_online__script_empty'))
  if (script.length > MAX_USER_API_SCRIPT_SIZE) throw new Error(window.i18n.t('user_api_import_online__script_too_large'))
  return script
}

const waitForApiInit = async(initPromise: Promise<boolean>, timeout = API_INIT_TIMEOUT) => new Promise<boolean>((resolve, reject) => {
  const timeoutId = window.setTimeout(() => {
    reject(new Error('api init timeout'))
  }, timeout)
  void initPromise.then(result => {
    window.clearTimeout(timeoutId)
    resolve(result)
  }).catch(err => {
    window.clearTimeout(timeoutId)
    reject(err)
  })
})

const downloadAndEnableUpdatedUserApi = async(updateUrl: string) => {
  const currentApiId = appSetting['common.apiSource']
  let sourceChanged = false
  let expectedSourceId = ''
  const stop = watch(() => appSetting['common.apiSource'], sourceId => {
    if (expectedSourceId && sourceId === expectedSourceId) {
      expectedSourceId = ''
      return
    }
    sourceChanged = true
  })

  try {
    const script = await getOnlineUserApiScript(updateUrl)
    if (sourceChanged || appSetting['common.apiSource'] !== currentApiId) throw new Error('source changed')

    const { apiInfo, apiList } = await importUserApi(script)
    userApi.list = apiList

    if (sourceChanged || appSetting['common.apiSource'] !== currentApiId) {
      userApi.list = await removeUserApi([apiInfo.id])
      throw new Error('source changed')
    }

    expectedSourceId = apiInfo.id
    const switchPromise = setUserApi(apiInfo.id)
    const initPromise = window.lx.apiInitPromise[0]
    await switchPromise
    let initSuccess: boolean
    try {
      initSuccess = await waitForApiInit(initPromise)
    } catch (err) {
      if (appSetting['common.apiSource'] !== apiInfo.id) throw new Error('source changed')

      expectedSourceId = currentApiId
      const rollbackPromise = setUserApi(currentApiId)
      const rollbackInitPromise = window.lx.apiInitPromise[0]
      await rollbackPromise
      const rollbackSuccess = await waitForApiInit(rollbackInitPromise)
      if (!rollbackSuccess) throw new Error('rollback updated api failed')

      userApi.list = await removeUserApi([apiInfo.id])
      throw err
    }
    if (!initSuccess) {
      if (appSetting['common.apiSource'] !== apiInfo.id) throw new Error('source changed')

      expectedSourceId = currentApiId
      const rollbackPromise = setUserApi(currentApiId)
      const rollbackInitPromise = window.lx.apiInitPromise[0]
      await rollbackPromise
      const rollbackSuccess = await waitForApiInit(rollbackInitPromise)
      if (!rollbackSuccess) throw new Error('rollback updated api failed')

      userApi.list = await removeUserApi([apiInfo.id])
      throw new Error('init updated api failed')
    }

    if (sourceChanged || appSetting['common.apiSource'] !== apiInfo.id) {
      throw new Error('source changed')
    }

    userApi.list = await removeUserApi([currentApiId])
  } finally {
    stop()
  }
}

export default () => {
  const t = useI18n()

  const rUserApiStatus = onUserApiStatus(({ params: { status, message, apiInfo } }) => {
    // console.log({ status, message, apiInfo })
    userApi.status = status
    userApi.message = message

    if (!apiInfo || apiInfo.id !== appSetting['common.apiSource']) return
    if (status) {
      if (apiInfo.sources) {
        let apis: any = {}
        let qualitys: LX.QualityList = {}
        for (const [source, { actions, type, qualitys: sourceQualitys }] of Object.entries(apiInfo.sources)) {
          if (type != 'music') continue
          apis[source as LX.Source] = {}
          for (const action of actions) {
            switch (action) {
              case 'musicUrl':
                apis[source].getMusicUrl = (songInfo: LX.Music.MusicInfo, type: LX.Quality) => {
                  const requestKey = `request__${Math.random().toString().substring(2)}`
                  return {
                    canceleFn() {
                      userApiRequestCancel(requestKey)
                    },
                    promise: sendUserApiRequest({
                      requestKey,
                      data: {
                        source,
                        action: 'musicUrl',
                        info: {
                          type,
                          musicInfo: songInfo,
                        },
                      },
                      // eslint-disable-next-line @typescript-eslint/promise-function-async
                    }).then(res => {
                      // console.log(res)
                      return { type, url: res.data.url }
                    }).catch(async err => {
                      console.log(err.message)
                      return Promise.reject(err)
                    }),
                  }
                }
                break
              case 'lyric':
                apis[source].getLyric = (songInfo: LX.Music.MusicInfo) => {
                  const requestKey = `request__${Math.random().toString().substring(2)}`
                  return {
                    canceleFn() {
                      userApiRequestCancel(requestKey)
                    },
                    promise: sendUserApiRequest({
                      requestKey,
                      data: {
                        source,
                        action: 'lyric',
                        info: {
                          type,
                          musicInfo: songInfo,
                        },
                      },
                      // eslint-disable-next-line @typescript-eslint/promise-function-async
                    }).then(res => {
                      // console.log(res)
                      return res.data
                    }).catch(async err => {
                      console.log(err.message)
                      return Promise.reject(err)
                    }),
                  }
                }
                break
              case 'pic':
                apis[source].getPic = (songInfo: LX.Music.MusicInfo) => {
                  const requestKey = `request__${Math.random().toString().substring(2)}`
                  return {
                    canceleFn() {
                      userApiRequestCancel(requestKey)
                    },
                    promise: sendUserApiRequest({
                      requestKey,
                      data: {
                        source,
                        action: 'pic',
                        info: {
                          type,
                          musicInfo: songInfo,
                        },
                      },
                      // eslint-disable-next-line @typescript-eslint/promise-function-async
                    }).then(res => {
                      // console.log(res)
                      return res.data
                    }).catch(async err => {
                      console.log(err.message)
                      return Promise.reject(err)
                    }),
                  }
                }
                break
              default:
                break
            }
          }
          qualitys[source as LX.Source] = sourceQualitys
        }
        qualityList.value = qualitys
        userApi.apis = apis
      }
    } else {
      userApi.apis = {}
      qualityList.value = {}
      if (message) {
        void dialog({
          message: `${t('user_api__init_failed_alert', { name: apiInfo.name })}\n${message}`,
          selection: true,
          confirmButtonText: t('ok'),
        })
      }
    }
    if (!window.lx.apiInitPromise[1]) window.lx.apiInitPromise[2](status)
  })

  const rUserApiShowUpdateAlert = onShowUserApiUpdateAlert(({ params: { name, log, updateUrl } }) => {
    if (updateUrl) {
      void dialog({
        message: `${t('user_api__update_alert', { name })}\n${log}`,
        selection: true,
        showCancel: true,
        confirmButtonText: appSetting['common.autoUpdate'] ? t('download') : t('user_api__update_alert_open_url'),
        cancelButtonText: t('close'),
      }).then(confirm => {
        if (!confirm) return
        window.setTimeout(() => {
          if (appSetting['common.autoUpdate']) {
            void downloadAndEnableUpdatedUserApi(updateUrl).catch(err => {
              console.log(err)
              void dialog({
                message: t('user_api_import__failed', { message: err.message }),
                selection: true,
                confirmButtonText: t('ok'),
              })
            })
          } else {
            void openUrl(updateUrl)
          }
        }, 300)
      })
    } else {
      void dialog({
        message: `${t('user_api__update_alert', { name })}\n${log}`,
        selection: true,
        confirmButtonText: t('ok'),
      })
    }
  })

  onBeforeUnmount(() => {
    rUserApiStatus()
    rUserApiShowUpdateAlert()
  })

  return async() => {
    await setUserApi(appSetting['common.apiSource'])
    void getUserApiList().then(list => {
      // console.log(list)
      // if (![...apiSourceInfo.map(s => s.id), ...list.map(s => s.id)].includes(appSetting['common.apiSource'])) {
      //   console.warn('reset api')
      //   let api = apiSourceInfo.find(api => !api.disabled)
      //   if (api) apiSource.value = api.id
      // }
      userApi.list = list
    }).catch(err => {
      console.log(err)
    })
  }
}
