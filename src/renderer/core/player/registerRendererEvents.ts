import { pause, play } from '@renderer/core/player/index'
import { PLAYER_EVENT_NAME } from '@common/ipcNames'
import { rendererOff, rendererOn } from '@common/rendererIpc'

export const registerPlayerAction = () => {
    rendererOn(PLAYER_EVENT_NAME.player_play, play)
    rendererOn(PLAYER_EVENT_NAME.player_pause, pause)

    return () => {
        rendererOff(PLAYER_EVENT_NAME.player_play, play)
        rendererOff(PLAYER_EVENT_NAME.player_pause, pause)
    }
}
