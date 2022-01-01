import {
  createAudio,
} from '@renderer/plugins/player'
import useMediaDevice from './useMediaDevice'
import usePlayerEvent from './usePlayerEvent'
import usePlayer from './usePlayer'

export default ({ setting }) => {
  createAudio()

  usePlayerEvent()
  useMediaDevice({ setting }) // 初始化音频驱动输出设置
  usePlayer({ setting })
}

