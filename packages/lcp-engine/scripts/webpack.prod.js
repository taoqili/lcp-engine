const { merge } = require('webpack-merge')
const common = require('./webpack.common')
const { OUTPUT_DIR } = require('./constant')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = merge(common, {
  mode: 'production',
  devtool: false,
  output: {
    filename: 'static/[name].[contenthash:8].js',
    path: OUTPUT_DIR
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'static/[name].[contenthash:8].css',
      chunkFilename: 'static/[name].[contenthash:8].chunk.css',
    }),
  ]
})