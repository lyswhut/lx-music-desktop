const fs = require('fs').promises
const path = require('path')

const sourceFilePath = path.join(__dirname, './kMandarin_8105.txt')
const distFilePath = path.join(__dirname, './pinyin.txt')

const yuanyin = [
  ['ā', 'a'],
  ['á', 'a'],
  ['ǎ', 'a'],
  ['à', 'a'],
  ['ē', 'e'],
  ['é', 'e'],
  ['ě', 'e'],
  ['è', 'e'],
  ['ī', 'i'],
  ['í', 'i'],
  ['ǐ', 'i'],
  ['ì', 'i'],
  ['ō', 'o'],
  ['ó', 'o'],
  ['ǒ', 'o'],
  ['ò', 'o'],
  ['ū', 'u'],
  ['ú', 'u'],
  ['ǔ', 'u'],
  ['ù', 'u'],
  ['ǖ', 'v'],
  ['ǘ', 'v'],
  ['ǚ', 'v'],
  ['ǜ', 'v'],
]

const parse = async() => {
  let datas = (await fs.readFile(sourceFilePath)).toString()
  datas = datas.replace(/ +=> +(\w|\+)+ */gm, ' ')
  for (const [y1, y2] of yuanyin) datas = datas.replaceAll(y1, y2)
  // console.log(datas)
  const lines = datas.split('\n')
  const dict = {}
  for (let line of lines) {
    if (!line || line.startsWith('#')) continue
    line = line.trim().replace(/^[\w+]+: */, '')
    let [p1, comment] = line.split('#')
    let [z, ps] = comment.split(/(?: *\? *-> *| *-> *)/)
    const ys = new Set([p1.trim()])
    if (ps != null) ps.split(/(?: +| *, *)/).forEach(y => ys.add(y.trim()))
    dict[z.trim()] = Array.from(ys)
  }

  fs.writeFile(distFilePath, JSON.stringify(dict))
}


parse()

// let dict = {}
// let line = 'U+2CBBF: qi  # 𬮿 ?-> gai,ai'

// line = line.trim().replace(/^[\w+]+: */, '')
// let [p1, comment] = line.split('#')
// let [z, ps] = comment.split(/ *\? *-> */)
// const ys = dict[z.trim()] = [p1.trim()]
// console.log(ps)
// if (ps != null) ys.push(...ps.split(/(?: +| *, *)/).map(y => y.trim()))
// console.log(dict)


