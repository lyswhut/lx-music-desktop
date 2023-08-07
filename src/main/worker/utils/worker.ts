import worker from 'node:worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/esm/node-adapter'


export const exposeWorker = (obj: any) => {
  if (worker.parentPort == null) return
  Comlink.expose(obj, nodeEndpoint(worker.parentPort))
}
