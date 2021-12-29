const { merge } = require('webpack-merge')
const common = require('./webpack.common')
const { OUTPUT_DIR } = require('./constant')

module.exports = merge(common, {
  mode: 'production',
  devtool: false,
  output: {
    filename: 'static/[name].[contenthash:8].js',
    path: OUTPUT_DIR
  },
})