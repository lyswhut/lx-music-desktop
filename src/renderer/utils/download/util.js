import { DH_STATES } from 'node-downloader-helper'


export const pauseResumeTimer = (_dl, wait) => {
  setTimeout(() => {
    if (_dl.state === DH_STATES.FINISHED || _dl.state === DH_STATES.FAILED) {
      return
    }

    _dl
      .pause()
      .then(() => console.log(`Paused for ${wait / 1000} seconds`))
      .then(() =>
        setTimeout(() => {
          if (!_dl.isResumable()) {
            console.warn(
              "This URL doesn't support resume, it will start from the beginning",
            )
          }
          return _dl.resume()
        }, wait),
      )
  }, wait)
}
