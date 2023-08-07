import fs from 'node:fs'
import path from 'node:path'

const rootPath = path.join(__dirname, '../../')

const assets = [
  [
    path.join(rootPath, './src/main/modules/userApi/renderer/user-api.html'),
    path.join(rootPath, './dist/main/user-api.html'),
  ],
  [
    path.join(rootPath, './src/static'),
    path.join(rootPath, './dist/static'),
  ],
  [
    path.join(rootPath, './src/common/theme/theme_images'),
    path.join(rootPath, './dist/renderer/theme_images'),
  ],
] as const

export default async() => {
  for (const [from, to] of assets) {
    await fs.promises.cp(from, to, {
      recursive: true,
    })
  }
}
