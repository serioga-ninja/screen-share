const parentConfig = require('./webpack.config');
const path = require('path');

const clientRootFolder = path.resolve(process.cwd(), 'src');

module.exports = (args) => {
  const config = parentConfig(args);

  return {
    ...config,
    watch: true,
    mode: 'development',
    devtool: 'source-map',
    optimization: {},
    entry: {
      index: path.resolve(clientRootFolder, 'index.ts')
    }
  };
};
