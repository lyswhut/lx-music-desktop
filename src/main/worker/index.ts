import { createDBServiceWorker } from './utils'


export default () => {
  return {
    dbService: createDBServiceWorker(),
  }
}

