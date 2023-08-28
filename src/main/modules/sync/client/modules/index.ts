import * as list from './list'
// export * as theme from './theme'


export const callObj = Object.assign({}, list.handler)


export const modules = {
  list,
}

export const featureVersion = {
  list: 1,
} as const
