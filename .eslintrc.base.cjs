const baseRule = {
  'no-new': 'off',
  camelcase: 'off',
  'no-return-assign': 'off',
  'space-before-function-paren': ['error', 'never'],
  'no-var': 'error',
  'no-fallthrough': 'off',
  eqeqeq: 'off',
  'require-atomic-updates': ['error', { allowProperties: true }],
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
  '@typescript-eslint/no-misused-promises': [
    'error',
    {
      checksVoidReturn: {
        arguments: false,
        attributes: false,
      },
    },
  ],
  '@typescript-eslint/naming-convention': 'off',
  '@typescript-eslint/return-await': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/comma-dangle': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
}
const vueRule = {
  ...typescriptRule,
  'vue/multi-word-component-names': 'off',
  'vue/max-attributes-per-line': 'off',
  'vue/singleline-html-element-content-newline': 'off',
  'vue/use-v-on-exact': 'off',
}

exports.base = {
  extends: ['standard'],
  rules: baseRule,
  parser: '@babel/eslint-parser',
}

exports.html = {
  files: ['*.html'],
  plugins: ['html'],
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
