const { merge } = require('webpack-merge')
const common = require('./webpack.common')
const { OUTPUT_DIR } = require('./constant')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserPlugin = require("terser-webpack-plugin")

module.exports = merge(common, {
  mode: 'production',
  devtool: false,
  output: {
    filename: 'static/[name].[contenthash:8].js',
    assetModuleFilename: 'static/[name].[contenthash:8].[ext]',
    path: OUTPUT_DIR
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'static/[name].[contenthash:8].css',
      chunkFilename: 'static/[name].[contenthash:8].chunk.css',
    }),
  ],
  optimization: {
    minimize: true,
    minimizer:[
      new CssMinimizerPlugin(),
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          compress: { pure_funcs: ['console.log'] },
        }
      }),
    ]
  }
})