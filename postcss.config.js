// const autoprefixer = require('autoprefixer')
const pxtorem = require('postcss-pxtorem')

module.exports = {
  plugins: [
    pxtorem({
      rootValue: 16,
      unitPrecision: 5,
      propList: [
        'font', 'font-size',
        'letter-spacing',
        'padding', 'margin',
        'padding-*', 'margin-*',
        'height', 'width',
        '*-height', '*-width',
        'flex', '::-webkit-scrollbar',
        'top', 'left', 'bottom', 'right',
        'border-radius',
      ],
      selectorBlackList: ['html', 'ignore-to-rem'],
      replace: true,
      mediaQuery: false,
      minPixelValue: 0,
      exclude: [/node_modules/i],
    }),
    // autoprefixer(),
  ],
}
