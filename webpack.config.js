const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    background: './src/background.js',
    widget:     './src/widget/index.js',
    popup:      './public/popup.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env'] },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: 'widget.css' }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public/popup.html', to: 'popup.html' },
        { from: 'icons', to: 'icons', noErrorOnMissing: true },
      ],
    }),
  ],
  resolve: { extensions: ['.js'] },
  // No code splitting — extension requires self-contained files
  optimization: { splitChunks: false, runtimeChunk: false },
};
