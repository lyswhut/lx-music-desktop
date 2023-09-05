import { SPLIT_CHAR } from '@common/constants'


export const filterRules = (rules: string) => {
  const list: string[] = []
  for (const item of rules.split('\n')) {
    if (!item) continue
    let [name, singer] = item.split(SPLIT_CHAR.DISLIKE_NAME)
    if (name) {
      name = name.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
      if (singer) {
        singer = singer.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
        list.push(`${name}${SPLIT_CHAR.DISLIKE_NAME}${singer}`)
      } else {
        list.push(name)
      }
    } else if (singer) {
      singer = singer.replaceAll(SPLIT_CHAR.DISLIKE_NAME, SPLIT_CHAR.DISLIKE_NAME_ALIAS).toLocaleLowerCase().trim()
      list.push(`${SPLIT_CHAR.DISLIKE_NAME}${singer}`)
    }
  }
  return new Set(list)
}
