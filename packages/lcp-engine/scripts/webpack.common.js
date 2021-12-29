const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { HOME_DIR } = require('./constant')

module.exports = {
  entry: {
    app: path.resolve(HOME_DIR, './src/index.js')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(HOME_DIR, './public/index.html'),
    }),
  ]
}