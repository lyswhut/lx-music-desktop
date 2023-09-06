import handler from './handler'
import { callObj as _callObj } from '../modules'
export { modules } from '../modules'

export const callObj = {
  ...handler,
  ..._callObj,
}
