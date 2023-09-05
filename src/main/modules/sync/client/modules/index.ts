import * as list from './list'
import * as dislike from './dislike'
// export * as theme from './theme'


export const callObj = Object.assign({},
  list.handler,
  dislike.handler,
)


export const modules = {
  list,
  dislike,
}

export const featureVersion = {
  list: 1,
  dislike: 1,
} as const
