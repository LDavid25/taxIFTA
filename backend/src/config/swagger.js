const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');

// Opciones de configuración de Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IFTA Easy Tax System API',
      version: config.app.version,
      description: 'API para el sistema de gestión de impuestos IFTA',
      contact: {
        name: 'Soporte',
        email: 'soporte@iftaeasytax.com',
      },
      license: {
        name: 'Propietario',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}/api`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './backend/src/routes/*.js',
    './backend/src/models/*.js',
    './backend/src/docs/*.yaml',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
  }),
  specs,
};
