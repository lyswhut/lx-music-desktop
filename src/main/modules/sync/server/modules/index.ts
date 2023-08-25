import { sync } from './list'

export const callObj = Object.assign({},
  sync.handler,
)

export const modules = {
  list: sync,
}


export { ListManage } from './list'
