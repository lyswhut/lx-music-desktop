import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { mainOn } from '@common/mainIpc'
import { commitDragOffsetX, sendCurrentStateToWindow, showTaskbarLyricMainInterface, showTaskbarLyricMenu, updateDragOffsetX, updateWindowState } from '@main/modules/taskbarLyric'
import { sendTaskbarButtonClick } from './app'
import type { TaskbarLyricDragMoveParams, TaskbarLyricState } from '@main/modules/taskbarLyric/types'

export default () => {
  mainOn<TaskbarLyricState>(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_set_state, ({ params }) => {
    updateWindowState(params)
  })

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_request_refresh, ({ event }) => {
    sendCurrentStateToWindow(event.sender)
  })

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_show_menu, () => {
    showTaskbarLyricMenu()
  })

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_show_main_interface, () => {
    showTaskbarLyricMainInterface()
  })

  mainOn<TaskbarLyricDragMoveParams>(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_drag_move, ({ params }) => {
    updateDragOffsetX(params.offsetX)
  })

  mainOn(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_drag_end, () => {
    commitDragOffsetX()
  })

  mainOn<'prev' | 'next' | 'play' | 'pause'>(WIN_MAIN_RENDERER_EVENT_NAME.taskbar_lyric_control, ({ params }) => {
    sendTaskbarButtonClick(params)
  })
}
