const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://web-gmy8nu1pi9fm.up-de-fra1-k8s-1.apps.run-on-seenode.com',
      changeOrigin: true,
    })
  );
};
