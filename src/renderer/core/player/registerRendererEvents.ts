import { pause, play, playPrev, playNext } from '@renderer/core/player/index'
import { PLAYER_EVENT_NAME } from '@common/ipcNames'
import { rendererOff, rendererOn } from '@common/rendererIpc'

export const registerPlayerAction = () => {
    rendererOn(PLAYER_EVENT_NAME.player_play, play)
    rendererOn(PLAYER_EVENT_NAME.player_pause, pause)
    rendererOn(PLAYER_EVENT_NAME.invoke_play_prev, () => { playPrev() })
    rendererOn(PLAYER_EVENT_NAME.invoke_play_next, () => { playNext() })

    return () => {
        rendererOff(PLAYER_EVENT_NAME.player_play, play)
        rendererOff(PLAYER_EVENT_NAME.player_pause, pause)
        rendererOff(PLAYER_EVENT_NAME.invoke_play_prev, () => { playPrev() })
        rendererOff(PLAYER_EVENT_NAME.invoke_play_next, () => { playNext() })
    }
}
