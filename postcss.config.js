const autoprefixer = require('autoprefixer')
const pxtorem = require('postcss-pxtorem')

module.exports = {
  plugins: [
    pxtorem({
      rootValue: 16,
      unitPrecision: 5,
      propList: [
        'font', 'font-size',
        'line-height',
        'letter-spacing',
        'padding', 'margin',
        'padding-left', 'padding-right',
        'padding-top', 'padding-bottom',
        'margin-left', 'margin-right',
        'margin-top', 'margin-bottom',
        'height', 'width',
        'max-width', 'max-height',
        'min-width', 'min-height',
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
    autoprefixer(),
  ],
}
