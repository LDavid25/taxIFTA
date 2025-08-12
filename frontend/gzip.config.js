const CompressionPlugin = require('compression-webpack-plugin');
const zlib = require('zlib');

module.exports = function override(config, env) {
  if (env === 'production') {
    config.plugins.push(
      new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.(js|css|html|json|ico|svg|eot|otf|ttf|woff|woff2)$/,
        threshold: 10240,
        minRatio: 0.8,
      })
    );

    config.plugins.push(
      new CompressionPlugin({
        filename: '[path][base].br',
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|json|ico|svg|eot|otf|ttf|woff|woff2)$/,
        compressionOptions: {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
          },
        },
        threshold: 10240,
        minRatio: 0.8,
      })
    );
  }
  return config;
};
