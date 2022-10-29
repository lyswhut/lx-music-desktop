import { nextTick, onBeforeUnmount } from '@common/utils/vueTools'
import {
  onUpdateAvailable,
  onUpdateDownloaded,
  onUpdateError,
  onUpdateNotAvailable,
  onUpdateProgress,
  getIgnoreVersion,
} from '@renderer/utils/ipc'
import { compareVer } from '@common/utils'
import { versionInfo } from '@renderer/store'
import { getVersionInfo } from '@renderer/utils/update'

export default () => {
  // 更新超时定时器
  let updateTimeout: number | null = window.setTimeout(() => {
    updateTimeout = null
    versionInfo.isTimeOut = true
    void nextTick(() => {
      showUpdateModal()
    })
  }, 60 * 30 * 1000)

  const clearUpdateTimeout = () => {
    if (!updateTimeout) return
    clearTimeout(updateTimeout)
    updateTimeout = null
  }

  const showUpdateModal = () => {
    void (versionInfo.newVersion?.history
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
        desc: '',
      }
      versionInfo.newVersion = result
      return result
    }).then((result: LX.VersionInfo) => {
      if (result.version == '0.0.0') {
        versionInfo.isUnknow = true
        versionInfo.showModal = true
        return
      }
      if (compareVer(versionInfo.version, result.version) != -1) {
        versionInfo.isLatestVer = true
        return
      }

      return getIgnoreVersion().then((ignoreVersion) => {
        if (result.version === ignoreVersion) return
        // console.log(this.version)
        void nextTick(() => {
          versionInfo.showModal = true
        })
      })
    })
  }

  const rUpdateAvailable = onUpdateAvailable(({ params: info }) => {
    versionInfo.isDownloading = true
    void getVersionInfo().catch(() => ({
      version: info.version,
      desc: info.releaseNotes,
    })).then(body => {
      // console.log(body)
      versionInfo.newVersion = body
      void nextTick(() => {
        versionInfo.showModal = true
      })
    })
  })
  const rUpdateNotAvailable = onUpdateNotAvailable(({ params: info }) => {
    clearUpdateTimeout()
    versionInfo.newVersion = {
      version: info.version,
      desc: info.releaseNotes as string,
    }
    versionInfo.isLatestVer = true
  })
  const rUpdateError = onUpdateError(() => {
    clearUpdateTimeout()
    versionInfo.isError = true
    void nextTick(() => {
      showUpdateModal()
    })
  })
  const rUpdateProgress = onUpdateProgress(({ params: progress }) => {
    versionInfo.downloadProgress = progress
  })
  const rUpdateDownloaded = onUpdateDownloaded(({ params: info }) => {
    clearUpdateTimeout()
    versionInfo.isDownloaded = true
    void nextTick(() => {
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
