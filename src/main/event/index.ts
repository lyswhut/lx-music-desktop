import { Event as App, Type as AppType } from './AppEvent'
import { Event as List, Type as ListType } from './ListEvent'

export type {
  AppType,
  ListType,
}

export const createAppEvent = (): AppType => {
  return new App()
}

export const createListEvent = (): ListType => {
  return new List()
}

