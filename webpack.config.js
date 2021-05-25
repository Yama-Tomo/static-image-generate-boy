const HtmlWebpackPlugin = require('html-webpack-plugin');
const PreactRefreshPlugin = require('@prefresh/webpack');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: process.env.NODE_ENV,
  entry: path.join(__dirname, 'src', 'index'),
  output: { path: path.join(__dirname, 'dist'), filename: 'build.js' },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: { loader: 'ts-loader', options: { transpileOnly: true } },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json', '.mjs', '.wasm'],
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      '~': path.resolve('./src'),
      '@prefresh/core': path.resolve('node_modules/.pnpm/node_modules/@prefresh/core'),
    },
  },
  devServer: {
    historyApiFallback: true,
    hot: true,
    inline: true,
    overlay: true,
  },
  devtool: 'eval-source-map',
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
    isDev && new PreactRefreshPlugin(),
  ].filter(Boolean),
};
