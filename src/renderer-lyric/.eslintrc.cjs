/* eslint-env node */
const { base, typescript, vue } = require('../../.eslintrc.base.cjs')

module.exports = {
  root: true,
  ...base,
  overrides: [
    vue,
    {
      ...typescript,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  ],
}
