const { RGB_Linear_Shade, RGB_Alpha_Shade } = require('./colorUtils')

exports.createThemeColors = (rgbaColor, isDark) => {
  const colors = {
    '--color-primary': rgbaColor,
  }

  let preColor = rgbaColor
  for (let i = 1; i < 11; i += 1) {
    preColor = RGB_Linear_Shade(isDark ? 0.2 : -0.1, preColor)
    colors[`--color-primary-dark-${i * 100}`] = preColor
    for (let j = 1; j < 10; j += 1) {
      colors[`--color-primary-dark-${i * 100}-alpha-${j * 100}`] = RGB_Alpha_Shade(0.1 * j, preColor)
      colors[`--color-primary-alpha-${j * 100}`] = RGB_Alpha_Shade(0.1 * j, rgbaColor)
    }
  }
  preColor = rgbaColor
  for (let i = 1; i < 10; i += 1) {
    preColor = RGB_Linear_Shade(isDark ? -0.1 : 0.2, preColor)
    colors[`--color-primary-light-${i * 100}`] = preColor
    for (let j = 1; j < 10; j += 1) {
      colors[`--color-primary-light-${i * 100}-alpha-${j * 100}`] = RGB_Alpha_Shade(0.1 * j, preColor)
    }
  }
  preColor = RGB_Linear_Shade(isDark ? -0.2 : 1, preColor)
  colors[`--color-primary-light-${1000}`] = preColor
  for (let j = 1; j < 10; j += 1) {
    colors[`--color-primary-light-${1000}-alpha-${j * 100}`] = RGB_Alpha_Shade(0.1 * j, preColor)
  }

  colors['--color-theme'] = isDark ? colors['--color-primary-light-900'] : rgbaColor

  return colors
}

// rgb(238, 238, 238)
// let prec = 'rgb(255, 255, 255)'
// let colors = [prec]
// for (let j = 1; j < 11; j += 1) {
//   colors.push(prec = RGB_Linear_Shade(-0.15, prec))
// }
// console.log(colors)
