const { merge } = require('webpack-merge')
const common = require('./webpack.common')
const { OUTPUT_DIR, SERVER_HOST, SERVER_PORT } = require('./constant')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  output: {
    filename: 'js/[name].js',
    path: OUTPUT_DIR
  },
  devServer: {
    host: SERVER_HOST,
    port: SERVER_PORT,
    compress: true,
    open: true,
    hot: true
  },
  plugins: [
    // 实际上只开启 hot：true 就会自动识别有无声明该插件，没有则自动引入，但是怕有隐藏问题这里还是手动加上了
    // new webpack.HotModuleReplacementPlugin()
  ]
})