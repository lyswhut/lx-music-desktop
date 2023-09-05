import { sync as listSync } from './list'
import { sync as dislikeSync } from './dislike'

export const callObj = Object.assign({},
  listSync.handler,
  dislikeSync.handler,
)

export const modules = {
  list: listSync,
  dislike: dislikeSync,
}


export { ListManage } from './list'

export { DislikeManage } from './dislike'

export const featureVersion = {
  list: 1,
  dislike: 1,
} as const
