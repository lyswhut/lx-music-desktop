const isDev = process.env.NODE_ENV === 'development'

export const debug = isDev && true
export const debugRequest = isDev && false
export const debugDownload = isDev && false
