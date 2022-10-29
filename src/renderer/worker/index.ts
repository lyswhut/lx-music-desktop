import { createMainWorker, createDownloadWorker } from './utils'


export default () => {
  return {
    main: createMainWorker(),
    download: createDownloadWorker(),
  }
}

