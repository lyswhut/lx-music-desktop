const baseRule = {
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
const typescriptRule = {
  ...baseRule,
  '@typescript-eslint/strict-boolean-expressions': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/space-before-function-paren': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
  '@typescript-eslint/restrict-template-expressions': [1, {
    allowBoolean: true,
    allowAny: true,
  }],
  '@typescript-eslint/restrict-plus-operands': [1, {
    allowBoolean: true,
    allowAny: true,
  }],
  '@typescript-eslint/naming-convention': 'off',
  '@typescript-eslint/return-await': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/comma-dangle': 'off',
}
const vueRule = {
  ...baseRule,
  'vue/multi-word-component-names': 'off',
  'vue/max-attributes-per-line': 'off',
  'vue/singleline-html-element-content-newline': 'off',
  'vue/use-v-on-exact': 'off',
}

exports.base = {
  extends: ['standard'],
  plugins: ['html'],
  rules: baseRule,
  parser: '@babel/eslint-parser',
}

exports.typescript = {
  files: ['*.ts'],
  rules: typescriptRule,
  parser: '@typescript-eslint/parser',
  extends: [
    'standard-with-typescript',
  ],
}

exports.vue = {
  files: ['*.vue'],
  rules: vueRule,
  parser: 'vue-eslint-parser',
  extends: [
    // 'plugin:vue/vue3-essential',
    'plugin:vue/base',
    'plugin:vue/vue3-recommended',
    'plugin:vue-pug/vue3-recommended',
    // "plugin:vue/strongly-recommended"
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
}
