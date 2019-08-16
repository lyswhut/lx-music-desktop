const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  // preserveWhitepace: true,
  compilerOptions: {
    whitespace: 'preserve',
  },
  extractCSS: !isDev,
  // cssModules: {
  //   localIndetName: '',
  // },
}
