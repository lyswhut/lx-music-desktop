import { Worker } from 'node:worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/esm/node-adapter'
import path from 'node:path'
// import dbService from '../dbService/index'

export declare type DBSeriveTypes = Comlink.Remote<LX.WorkerDBSeriveListTypes>

export const createDBServiceWorker = () => {
  // console.log(new URL('../dbService', import.meta.url))
  // console.log(__dirname)
  const worker: Worker = new Worker(path.join(__dirname, './dbService.worker'))
  return Comlink.wrap<LX.WorkerDBSeriveListTypes>(nodeEndpoint(worker))
}

