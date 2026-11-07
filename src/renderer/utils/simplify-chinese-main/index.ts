import { simplified, traditional } from './chinese'

const stMap = new Map<string, string>()
const tsMap = new Map<string, string>()

simplified.split('').forEach((char, index) => {
  stMap.set(char, traditional[index])
  tsMap.set(traditional[index], char)
})

function simplify(source: string): string {
  let result: string[] = []
  for (const char of source) {
    result.push(tsMap.get(char) ?? char)
  }
  return result.join('')
}

function tranditionalize(source: string): string {
  let result: string[] = []
  for (const char of source) {
    result.push(stMap.get(char) ?? char)
  }
  return result.join('')
}

export {
  simplify,
  tranditionalize,
}
