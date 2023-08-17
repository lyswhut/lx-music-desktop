import { Worker } from 'node:worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/esm/node-adapter'

export type DBSeriveTypes = Comlink.Remote<LX.WorkerDBSeriveListTypes>

export const createDBServiceWorker = () => {
  const worker: Worker = new Worker(new URL(
    /* webpackChunkName: 'dbService.worker' */
    '../dbService',
    import.meta.url,
  ))
  return Comlink.wrap<LX.WorkerDBSeriveListTypes>(nodeEndpoint(worker))
}

