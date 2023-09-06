import handler from './handler'
import { callObj as _callObj } from '../../modules'
export { sync } from './sync'
export { modules } from '../../modules'
export * from './event'

export const callObj = {
  ...handler,
  ..._callObj,
}
