import { exposeWorker } from '../utils/worker'

import * as common from './common'
import * as list from './list'
import * as music from './music'


console.log('hello main worker')


exposeWorker(Object.assign({}, common, list, music))

export type workerMainTypes = typeof common
  & typeof list
  & typeof music
