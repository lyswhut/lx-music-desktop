const pinyinData = require('@common/utils/pinyin/pinyin.json')

const RE_LETTER = /[a-zA-Z]/
const RE_CHINESE = /[\u4e00-\u9fa5]/

const getPinyinInitial = (char) => {
  const pinyin = pinyinData[char]
  return pinyin?.[0]?.[0]?.toUpperCase() || char.toUpperCase()
}

export const getFirstLetter = (str) => {
  if (!str) return '#'
  const firstChar = str[0]

  if (RE_LETTER.test(firstChar)) return firstChar.toUpperCase()
  if (RE_CHINESE.test(firstChar)) {
    const initial = getPinyinInitial(firstChar)
    return RE_LETTER.test(initial) ? initial : '#'
  }
  return '#'
}

export const groupByFirstLetter = (list) => {
  const groups = {}

  for (let i = 65; i <= 90; i++) {
    groups[String.fromCharCode(i)] = []
  }
  groups['#'] = []

  list.forEach((item, index) => {
    const letter = getFirstLetter(item.name)
    ;(groups[letter] || groups['#']).push(index)
  })

  const letters = []
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i)
    if (groups[letter].length) letters.push(letter)
  }
  if (groups['#'].length) letters.push('#')

  return { letters, groups }
}
