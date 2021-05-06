const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

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
    },
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
};
