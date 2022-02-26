import { onBeforeUnmount, useI18n } from '@renderer/utils/vueTools'
import { onUserApiStatus, setUserApi, getUserApiList, userApiRequest, userApiRequestCancel, onShowUserApiUpdateAlert } from '@renderer/utils/tools'
import { openUrl } from '@renderer/utils'
import apiSourceInfo from '@renderer/utils/music/api-source-info'
import music from '@renderer/utils/music'
import { apiSource, qualityList, userApi } from '@renderer/core/share'
import { dialog } from '@renderer/plugins/Dialog'


export default ({ setting }) => {
  const { t } = useI18n()

  if (/^user_api/.test(setting.value.apiSource)) {
    setUserApi(setting.value.apiSource)
  } else {
    qualityList.value = music.supportQuality[setting.value.apiSource]
  }

  const rUserApiStatus = onUserApiStatus((event, { status, message, apiInfo }) => {
    userApi.status = status
    userApi.message = message

    if (status) {
      if (apiInfo.id === setting.value.apiSource) {
        let apis = {}
        let qualitys = {}
        for (const [source, { actions, type, qualitys: sourceQualitys }] of Object.entries(apiInfo.sources)) {
          if (type != 'music') continue
          apis[source] = {}
          for (const action of actions) {
            switch (action) {
              case 'musicUrl':
                apis[source].getMusicUrl = (songInfo, type) => {
                  const requestKey = `request__${Math.random().toString().substring(2)}`
                  return {
                    canceleFn() {
                      userApiRequestCancel(requestKey)
                    },
                    promise: userApiRequest({
                      requestKey,
                      data: {
                        source: source,
                        action: 'musicUrl',
                        info: {
                          type,
                          musicInfo: songInfo,
                        },
                      },
                    }).then(res => {
                      // console.log(res)
                      if (!/^https?:/.test(res.data.url)) return Promise.reject(new Error('Get url failed'))
                      return { type, url: res.data.url }
                    }).catch(err => {
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
          qualitys[source] = sourceQualitys
        }
        qualityList.value = qualitys
        userApi.apis = apis
      }
    }
  })

  const rUserApiShowUpdateAlert = onShowUserApiUpdateAlert((event, { name, log, updateUrl }) => {
    if (updateUrl) {
      dialog({
        message: `${t('user_api__update_alert', { name })}\n${log}`,
        selection: true,
        showCancel: true,
        confirmButtonText: t('user_api__update_alert_open_url'),
        cancelButtonText: t('close'),
      }).then(confirm => {
        if (!confirm) return
        setTimeout(() => {
          openUrl(updateUrl)
        }, 300)
      })
    } else {
      dialog({
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

  return () => {
    return getUserApiList().then(list => {
      // console.log(list)
      if (![...apiSourceInfo.map(s => s.id), ...list.map(s => s.id)].includes(setting.value.apiSource)) {
        console.warn('reset api')
        let api = apiSourceInfo.find(api => !api.disabled)
        if (api) apiSource.value = api.id
      }
      userApi.list = list
    }).catch(err => {
      console.log(err)
    })
  }
}
