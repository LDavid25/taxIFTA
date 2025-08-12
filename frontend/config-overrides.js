const { override, addWebpackPlugin, adjustWorkbox } = require('customize-cra');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const zlib = require('zlib');
const webpack = require('webpack');

const addCompression = () => config => {
  if (config.mode === 'production') {
    // Deshabilitar source maps en producción
    config.devtool = false;

    // Optimizar moment.js (si lo estás usando)
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\/\*!|moment$/,
      })
    );

    // Optimizar chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )?.[1];
              return `npm.${packageName?.replace('@', '')}`;
            },
          },
        },
      },
      // Minimizar el código
      minimize: true,
      // Configuración del minimizador
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            compress: {
              drop_console: true, // Eliminar console.logs en producción
              drop_debugger: true,
              pure_funcs: ['console.log']
            },
            output: {
              comments: false, // Eliminar comentarios
            },
          },
        }),
      ],
    };

    // Agregar compresión Gzip y Brotli
    config.plugins.push(
      new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.(js|css|html|json|ico|svg|eot|otf|ttf|woff|woff2)$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
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

module.exports = override(
  addCompression(),
  // Optimizar el service worker
  adjustWorkbox(wb =>
    Object.assign(wb, {
      skipWaiting: true,
      exclude: (wb.exclude || []).concat('index.html')
    })
  )
);
