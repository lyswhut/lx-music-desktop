/* eslint-env node */
const { base, html, typescript, vue } = require('../../.eslintrc.base.cjs')

module.exports = {
  root: true,
  ...base,
  overrides: [
    html,
    vue,
    {
      ...typescript,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  ],
}
