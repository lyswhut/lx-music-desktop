const javascript = {
  'no-new': 'off',
  camelcase: 'off',
  'no-return-assign': 'off',
  'space-before-function-paren': ['error', 'never'],
  'no-var': 'error',
  'no-fallthrough': 'off',
  'prefer-promise-reject-errors': 'off',
  eqeqeq: 'off',
  'no-multiple-empty-lines': [1, { max: 2 }],
  'comma-dangle': [2, 'always-multiline'],
  'standard/no-callback-literal': 'off',
  'prefer-const': 'off',
  'no-labels': 'off',
  'node/no-callback-literal': 'off',
  'multiline-ternary': 'off',
}
const typescript = {
  ...javascript,
  '@typescript-eslint/strict-boolean-expressions': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/space-before-function-paren': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
  '@typescript-eslint/restrict-template-expressions': [1, {
    allowBoolean: true,
  }],
  '@typescript-eslint/naming-convention': 'off',
  '@typescript-eslint/return-await': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/comma-dangle': 'off',
}
const vue = {
  ...typescript,
  'vue/multi-word-component-names': 'off',
  'vue/max-attributes-per-line': 'off',
  'vue/singleline-html-element-content-newline': 'off',
  'vue/use-v-on-exact': 'off',
}
delete vue['@typescript-eslint/restrict-template-expressions']

module.exports = {
  root: true,
  extends: [
    'standard',
  ],
  plugins: [
    'html',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    // "requireConfigFile": false
  },
  rules: javascript,
  ignorePatterns: ['vendors', '*.min.js', 'dist'],
  overrides: [
    {
      files: ['*.vue'],
      rules: vue,
      parser: 'vue-eslint-parser',
      extends: [
        'plugin:vue/base',
        // "plugin:vue/strongly-recommended"
        'plugin:vue/vue3-recommended',
        'plugin:vue-pug/vue3-recommended',
        'standard-with-typescript',
      ],
      parserOptions: {
        sourceType: 'module',
        parser: {
          // Script parser for `<script>`
          js: '@typescript-eslint/parser',

          // Script parser for `<script lang="ts">`
          ts: '@typescript-eslint/parser',
        },
        extraFileExtensions: ['.vue'],
      },
    },
    {
      files: ['*.ts'],
      rules: typescript,
      parser: '@typescript-eslint/parser',
      extends: [
        'standard-with-typescript',
      ],
      parserOptions: {
        project: './src/**/tsconfig.json',
      },
    },
  ],
}
