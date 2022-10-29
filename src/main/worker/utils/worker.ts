import { parentPort } from 'worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/esm/node-adapter'


export const exposeWorker = (obj: any) => {
  if (parentPort == null) return
  Comlink.expose(obj, nodeEndpoint(parentPort))
}
