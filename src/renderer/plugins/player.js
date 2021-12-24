let audio
let audioContext
let mediaSource
let analyser
export const createAudio = () => {
  if (audio) return
  window.audio = audio = new window.Audio()
  audio.controls = false
  audio.autoplay = true
  audio.preload = 'auto'
}

export const getAnalyser = () => {
  if (audioContext == null) {
    audioContext = new window.AudioContext()
    mediaSource = audioContext.createMediaElementSource(audio)
    analyser = audioContext.createAnalyser()
    mediaSource.connect(analyser)
    analyser.connect(audioContext.destination)
  }
  return analyser
}

export const setResource = src => {
  if (audio) audio.src = src
}

export const setPlay = () => {
  audio?.play()
}

export const setPause = () => {
  audio?.pause()
}

export const setStop = () => {
  if (audio) {
    audio.src = null
    audio.removeAttribute('src')
  }
}

export const isEmpty = () => !audio?.src

export const setLoopPlay = isLoop => {
  if (audio) audio.loop = isLoop
}

export const getMute = () => {
  return audio?.muted ?? false
}

export const setMute = isMute => {
  if (audio) audio.muted = isMute
}

export const getCurrentTime = () => {
  return audio?.currentTime ?? 0
}

export const setCurrentTime = time => {
  if (audio) audio.currentTime = time
}

export const setMediaDeviceId = mediaDeviceId => {
  return audio ? audio.setSinkId(mediaDeviceId) : Promise.resolve()
}

export const setVolume = volume => {
  if (audio) audio.volume = volume
}

export const getDuration = () => {
  return audio?.duration ?? 0
}

export const getPlaybackRate = () => {
  return audio?.playbackRate ?? 1
}

export const onPlaying = callback => {
  audio.addEventListener('playing', callback)
  return () => {
    audio.removeEventListener('playing', callback)
  }
}

export const onPause = callback => {
  audio.addEventListener('pause', callback)
  return () => {
    audio.removeEventListener('pause', callback)
  }
}

export const onEnded = callback => {
  audio.addEventListener('ended', callback)
  return () => {
    audio.removeEventListener('ended', callback)
  }
}

export const onError = callback => {
  audio.addEventListener('error', callback)
  return () => {
    audio.removeEventListener('error', callback)
  }
}

export const onLoadeddata = callback => {
  audio.addEventListener('loadeddata', callback)
  return () => {
    audio.removeEventListener('loadeddata', callback)
  }
}

export const onLoadstart = callback => {
  audio.addEventListener('loadstart', callback)
  return () => {
    audio.removeEventListener('loadstart', callback)
  }
}

export const onCanplay = callback => {
  audio.addEventListener('canplay', callback)
  return () => {
    audio.removeEventListener('canplay', callback)
  }
}

export const onEmptied = callback => {
  audio.addEventListener('emptied', callback)
  return () => {
    audio.removeEventListener('emptied', callback)
  }
}

export const onTimeupdate = callback => {
  audio.addEventListener('timeupdate', callback)
  return () => {
    audio.removeEventListener('timeupdate', callback)
  }
}

// 缓冲中
export const onWaiting = callback => {
  audio.addEventListener('waiting', callback)
  return () => {
    audio.removeEventListener('waiting', callback)
  }
}

// 可见性改变
export const onVisibilityChange = callback => {
  document.addEventListener('visibilitychange', callback)
  return () => {
    document.removeEventListener('visibilitychange', callback)
  }
}


export const getErrorCode = () => {
  return audio?.error?.code
}
