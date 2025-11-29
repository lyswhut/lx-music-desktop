/**
 *
 * @param {string} text
 * @returns
 */
export const parseChangelog = async(text) => {
  const versions = []
  const lines = text.split(/\r\n|\r|\n/)
  let currentVersion = null
  let currentDate = null
  let currentDesc = ''

  for (const line of lines) {
    const versionMatch = line.match(/^\s*##\s+\[?(\d+\.\d+\.\d+)\]?.*?-\s+(\d{4}-\d{2}-\d{2})$/)
    if (versionMatch) {
      if (currentVersion) {
        versions.push({
          version: currentVersion,
          date: currentDate,
          desc: currentDesc.trim(),
        })
      }
      currentVersion = versionMatch[1]
      currentDate = versionMatch[3]
      currentDesc = ''
    } else {
      currentDesc += `${line}\n`
    }
  }

  if (currentVersion) {
    versions.push({
      version: currentVersion,
      date: currentDate,
      desc: currentDesc.trim(),
    })
  }

  return versions
}
