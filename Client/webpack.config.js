const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const clientRootFolder = path.resolve(process.cwd(), 'Client', 'src');

module.exports = (args) => {
  return {
    watch: false,
    mode: 'production',
    devtool: 'hidden-source-map',
    target: 'web',
    optimization: {
      minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
    },
    entry: {
      index: path.resolve(clientRootFolder, 'index.ts')
    },
    output: {
      path: path.resolve(process.cwd(), 'dist', 'public'),
      filename: '[name].js',
    },
    resolve: {
      extensions: ['.ts', '.js', '.json']
    },
    resolveLoader: {
      // An array of directory names to be resolved to the current directory
      modules: ['node_modules'],
    },
    module: {
      rules: [
        {
          test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)(\?.*$|$)/,
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
          },
        },
        {
          test: /\.css|\.s(c|a)ss$/,
          use: [{
            loader: 'lit-scss-loader',
            options: {
              minify: true, // defaults to false
            },
          }, 'extract-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.(ts|js)x?$/,
          exclude: /(node_modules|bower_components|libs)/,
          use: {
            loader: 'babel-loader'
          },
        },
        {
          test: /.json$/,
          loader: 'json-loader'
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(clientRootFolder, 'index.html'),
        inject: 'body'
      }),
      new CircularDependencyPlugin({
        // exclude detection of files based on a RegExp
        exclude: /a\.js|node_modules/,
        // add errors to webpack instead of warnings
        failOnError: false,
        // allow import cycles that include an asyncronous import,
        // e.g. via import(/* webpackMode: "weak" */ './file.js')
        allowAsyncCycles: false,
        // set the current working directory for displaying module paths
        cwd: process.cwd(),
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: '[name].css',
      }),
    ]
  };
};
