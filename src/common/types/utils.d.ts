type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}

type Modify<T, R> = Omit<T, keyof R> & R

// type UndefinedOrNever = undefined
type Actions<T extends { action: string, data?: any }> = {
  [U in T as U['action']]: 'data' extends keyof U ? U['data'] : undefined
}

type WarpPromiseValue<T> = T extends ((...args: infer P) => Promise<infer R>)
  ? ((...args: P) => Promise<R>)
  : T extends ((...args: infer P2) => infer R2)
    ? ((...args: P2) => Promise<R2>)
    : Promise<T>

type WarpPromiseRecord<T extends Record<string, any>> = {
  [K in keyof T]: WarpPromiseValue<T[K]>
}
