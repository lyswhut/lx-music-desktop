import { useAction, nextTick, onBeforeUnmount } from '@renderer/utils/vueTools'
import { onUpdateAvailable, onUpdateDownloaded, onUpdateError, onUpdateNotAvailable, onUpdateProgress } from '@renderer/utils/tools'
import { compareVer } from '@renderer/utils'
import { versionInfo } from '@renderer/core/share'

export default (setting) => {
  const getVersionInfo = useAction('getVersionInfo')

  // 更新超时定时器
  let updateTimeout = setTimeout(() => {
    updateTimeout = null
    versionInfo.isTimeOut = true
    nextTick(() => {
      showUpdateModal()
    })
  }, 60 * 30 * 1000)

  const clearUpdateTimeout = () => {
    if (!updateTimeout) return
    clearTimeout(updateTimeout)
    updateTimeout = null
  }

  const showUpdateModal = () => {
    (versionInfo.newVersion && versionInfo.newVersion.history
      ? Promise.resolve(versionInfo.newVersion)
      : getVersionInfo().then(body => {
        versionInfo.newVersion = body
        return body
      })
    ).catch(() => {
      if (versionInfo.newVersion) return versionInfo.newVersion
      versionInfo.isUnknow = true
      let result = {
        version: '0.0.0',
        desc: null,
      }
      versionInfo.newVersion = result
      return result
    }).then(result => {
      if (result.version == '0.0.0') {
        versionInfo.isUnknow = true
        versionInfo.showModal = true
        return
      }
      if (compareVer(versionInfo.version, result.version) != -1) {
        versionInfo.isLatestVer = true
        return
      }

      if (result.version === setting.value.ignoreVersion) return
      // console.log(this.version)
      nextTick(() => {
        versionInfo.showModal = true
      })
    })
  }

  const rUpdateAvailable = onUpdateAvailable((event, info) => {
    versionInfo.isDownloading = true
    getVersionInfo().catch(() => ({
      version: info.version,
      desc: info.releaseNotes,
    })).then(body => {
      // console.log(body)
      versionInfo.newVersion = body
      nextTick(() => {
        versionInfo.showModal = true
      })
    })
  })
  const rUpdateNotAvailable = onUpdateNotAvailable((event, info) => {
    clearUpdateTimeout()
    versionInfo.newVersion = {
      version: info.version,
      desc: info.releaseNotes,
    }
    versionInfo.isLatestVer = true
  })
  const rUpdateError = onUpdateError((event, info) => {
    clearUpdateTimeout()
    versionInfo.isError = true
    nextTick(() => {
      showUpdateModal()
    })
  })
  const rUpdateProgress = onUpdateProgress((event, progress) => {
    versionInfo.downloadProgress = progress
  })
  const rUpdateDownloaded = onUpdateDownloaded((event, info) => {
    clearUpdateTimeout()
    versionInfo.isDownloaded = true
    nextTick(() => {
      showUpdateModal()
    })
  })

  onBeforeUnmount(() => {
    clearUpdateTimeout()
    rUpdateAvailable()
    rUpdateNotAvailable()
    rUpdateError()
    rUpdateProgress()
    rUpdateDownloaded()
  })
}
