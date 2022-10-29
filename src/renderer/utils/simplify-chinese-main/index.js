import { simplified, traditional } from './chinese'

const stMap = new Map()
const tsMap = new Map()

simplified.split('').forEach((char, index) => {
  stMap.set(char, traditional[index])
  tsMap.set(traditional[index], char)
})

function simplify(source) {
  let result = []
  for (const char of source) {
    result.push(tsMap.get(char) || char)
  }
  return result.join('')
}

function tranditionalize(source) {
  let result = []
  for (const char of source) {
    result.push(stMap.get(char) || char)
  }
  return result.join('')
}

export {
  simplify,
  tranditionalize,
}
