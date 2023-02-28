import { log as writeLog } from '@common/utils'

export default {
  r_info(...params: any[]) {
    writeLog.info(...params)
  },
  r_warn(...params: any[]) {
    writeLog.warn(...params)
  },
  r_error(...params: any[]) {
    writeLog.error(...params)
  },
  info(...params: any[]) {
    // if (global.lx.isEnableSyncLog) writeLog.info(...params)
    console.log(...params)
  },
  warn(...params: any[]) {
    // if (global.lx.isEnableSyncLog) writeLog.warn(...params)
    console.warn(...params)
  },
  error(...params: any[]) {
    // if (global.lx.isEnableSyncLog) writeLog.error(...params)
    console.warn(...params)
  },
}
