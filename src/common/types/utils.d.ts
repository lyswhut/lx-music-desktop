type MakeOptional<Type, Key extends keyof Type> = Omit<Type, Key> & Partial<Pick<Type, Key>>

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}

type Modify<T, R> = Omit<T, keyof R> & R
