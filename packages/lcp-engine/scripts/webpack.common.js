const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WebpackBar = require('webpackbar')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const {HOME_DIR, OUTPUT_DIR} = require('./constant')
const {isDev, isProd} = require('./env')

const getCssLoaders = () => {
  const cssLoaders = [
    isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        // modules: {
        //   localIdentName: "[local]--[hash:base64:5]"
        // },
        sourceMap: isDev,
      }
    }
  ]
  isProd && cssLoaders.push({
    loader: 'postcss-loader',
    options: {
      postcssOptions: {
        plugins: [
          isProd && [
            'postcss-preset-env', // 需要配合package.json里的browserslist才能生效
            {
              autoprefixer: {
                grid: true
              }
            }
          ]
        ]
      }
    }
  })
  return cssLoaders
}
module.exports = {
  entry: {
    app: path.resolve(HOME_DIR, './src/index.tsx')
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    alias: {
      "@": path.resolve(HOME_DIR, './src'),
      "engine": path.resolve(HOME_DIR, './src/engine'),
      "utils": path.resolve(HOME_DIR, './src/utils')
    }
  },
  module: {
    rules: [
      {
        test: /\.(tsx?|jsx?)$/,
        loader: 'babel-loader',
        options: { cacheDirectory: true },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [...getCssLoaders()]
      },
      {
        test: /\.less$/,
        use: [
          ...getCssLoaders(),
          {
            loader: 'less-loader',
            options: {
              sourceMap: isDev,
            }
          }
        ]
      },
      {
        test: [/\.gif$/, /\.jpe?g$/, /\.a?png$/],
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 2 * 1024,
          },
        },
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2?)$/,
        type: 'asset/resource',
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(HOME_DIR, './public/index.html'),
    }),
    new WebpackBar({
      name: 'Compiled success!',
      color: '#52c41a'
    }),
    new CopyPlugin({
      patterns: [
        {
          context: 'public',
          from: '**/*',
          to: OUTPUT_DIR,
          toType: 'dir',
          globOptions: {
            dot: true,
            gitignore: true,
            ignore: ['**/index.html'],
          },
        },
      ],
    })
  ]
}