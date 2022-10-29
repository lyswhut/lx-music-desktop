import { workerMainTypes } from '@renderer/worker/main/index'
import { workerDownloadTypes } from '@renderer/worker/download/index'


declare global {
  namespace LX {
    type WorkerMainTypes = workerMainTypes
    type WorkerDownloadTypes = workerDownloadTypes
  }
}
