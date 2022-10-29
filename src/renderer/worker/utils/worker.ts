import * as Comlink from 'comlink'


export const exposeWorker = (obj: any) => {
  Comlink.expose(obj)
}
