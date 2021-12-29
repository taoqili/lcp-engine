const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { HOME_DIR } = require('./constant')

module.exports = {
  entry: {
    app: path.resolve(HOME_DIR, './src/index.ts')
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    alias: {
      "@": path.resolve(HOME_DIR, './src'),
      "engine": path.resolve(HOME_DIR, './src/engine'),
      "utils": path.resolve(HOME_DIR, './src/utils')
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(HOME_DIR, './public/index.html'),
    }),
  ]
}