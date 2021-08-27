const parentConfig = require('./webpack.config');

module.exports = (args) => {
  const config = parentConfig(args);

  return {
    ...config,
    watch: true,
    mode: 'development',
    devtool: 'inline-source-map',
    optimization: {}
  };
};
