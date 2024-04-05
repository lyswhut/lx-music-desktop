const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  modules: {
    localIdentName: isDev ? '[path][name]__[local]--[hash:base64:5]' : '[hash:base64:5]',
    exportLocalsConvention: 'camelCase',
    namedExport: false,
  },
  sourceMap: isDev,
}
