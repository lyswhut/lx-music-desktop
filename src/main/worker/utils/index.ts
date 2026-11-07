// webpack 5.111+ 的 worker 检测语法为 "Worker from worker_threads"（不带 node: 前缀）：
// 使用带前缀的值导入会让全局 "Worker" 与导入绑定两套替换规则重叠，生成非法代码。
// 构造器改名以仅命中导入分支（不替换构造器标识符）。
import { Worker as WorkerCtor } from 'worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/esm/node-adapter'

export type DBSeriveTypes = Comlink.Remote<LX.WorkerDBSeriveListTypes>

export const createDBServiceWorker = () => {
  const worker: WorkerCtor = new WorkerCtor(new URL(
    /* webpackChunkName: 'dbService.worker' */
    '../dbService',
    import.meta.url,
  ))
  return Comlink.wrap<LX.WorkerDBSeriveListTypes>(nodeEndpoint(worker))
}

