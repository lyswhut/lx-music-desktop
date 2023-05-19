import { exposeWorker } from '../utils/worker'

import * as common from './common'
import * as download from './download'


console.log('hello download worker')


exposeWorker(Object.assign({}, common, download))

export type workerDownloadTypes = typeof common &
  typeof download
