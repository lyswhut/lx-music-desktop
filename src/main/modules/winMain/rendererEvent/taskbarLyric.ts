import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { mainOn } from '@common/mainIpc'
import { commitDragOffsetX, sendCurrentStateToWindow, updateDragOffsetX, updateWindowState } from '@main/modules/taskbarLyric'
import type { TaskbarLyricDragMoveParams, TaskbarLyricState } from '@main/modules/taskbarLyric/types'

export default () => {
  mainOn<TaskbarLyricState>(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_set_state, ({ params }) => {
    updateWindowState(params)
  })

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_request_refresh, ({ event }) => {
    sendCurrentStateToWindow(event.sender)
  })

  mainOn<TaskbarLyricDragMoveParams>(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_drag_move, ({ params }) => {
    updateDragOffsetX(params.offsetX)
  })

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_drag_end, () => {
    commitDragOffsetX()
  })
}
