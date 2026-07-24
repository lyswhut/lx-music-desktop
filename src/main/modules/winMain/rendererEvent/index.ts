import { registerRendererEvents as common } from '@main/modules/commonRenderers/common'
import { registerRendererEvents as list } from '@main/modules/commonRenderers/list'
import { registerRendererEvents as dislike } from '@main/modules/commonRenderers/dislike'
import app, { sendConfigChange } from './app'
import hotKey from './hotKey'
import kw_decodeLyric from './kw_decodeLyric'
import tx_decodeLyric from './tx_decodeLyric'
import userApi from './userApi'
import sync from './sync'
import data from './data'
import music from './music'
import download from './download'
import soundEffect from './soundEffect'
import openAPI from './openAPI'
import { sendEvent } from '../main'

export * from './app'
export * from './hotKey'
export * from './userApi'
export * from './sync'
export * from './process'

let isInitialized = false
export default () => {
  if (isInitialized) return
  isInitialized = true

  common(sendEvent)
  list(sendEvent)
  dislike(sendEvent)
  app()
  hotKey()
  kw_decodeLyric()
  tx_decodeLyric()
  userApi()
  sync()
  data()
  music()
  download()
  soundEffect()
  openAPI()

  global.lx.event_app.on('updated_config', (keys, setting) => {
    sendConfigChange(setting)
  })
}

