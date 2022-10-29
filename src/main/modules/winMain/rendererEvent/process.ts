import { WIN_MAIN_RENDERER_EVENT_NAME } from '@common/ipcNames'
import { getWebContents } from '../main'


// export default () => {


// }

/**
 * 发送桌面歌词进程创建事件
 * @param port 端口
 */
export const sendNewDesktopLyricClient = (port: Electron.MessagePortMain) => {
  getWebContents().postMessage(WIN_MAIN_RENDERER_EVENT_NAME.process_new_desktop_lyric_client, null, [port])
}


