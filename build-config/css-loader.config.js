const isDev = process.env.NODE_ENV === 'development'

module.exports = {
  modules: {
    localIdentName: isDev ? '[folder]-[name]--[local]--[hash:base64:5]' : '[hash:base64:5]',
    exportLocalsConvention: 'camelCase',
  },
}
