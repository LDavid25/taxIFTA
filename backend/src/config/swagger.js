const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const packageJson = require('../../package.json');

// API Information
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IFTA Easy Tax System API',
      version: packageJson.version || '1.0.0',
      description: 'Comprehensive API for managing IFTA tax calculations, trips, and vehicle information',
      termsOfService: 'https://iftaeasytax.com/terms',
      contact: {
        name: 'API Support',
        url: 'https://iftaeasytax.com/support',
        email: 'support@iftaeasytax.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: 'Development server'
      },
      {
        url: 'https://api.iftaeasytax.com/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for external services'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Unauthorized. Authentication credentials were missing or incorrect.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'The specified resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'An error occurred while processing your request'
            },
            code: {
              type: 'integer',
              example: 500
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'fail'
            },
            message: {
              type: 'string',
              example: 'Validation error'
            },
            code: {
              type: 'integer',
              example: 400
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Email is required'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User account management'
      },
      {
        name: 'Vehicles',
        description: 'Vehicle management'
      },
      {
        name: 'Trips',
        description: 'Trip management and reporting'
      },
      {
        name: 'Reports',
        description: 'IFTA tax reports and calculations'
      }
    ]
  },
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../models/*.js'),
    path.join(__dirname, '../docs/**/*.yaml'),
    path.join(__dirname, '../docs/**/*.json')
  ]
};

// Initialize swagger-jsdoc
const specs = swaggerJsdoc(options);

// Configure Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b4151; }
    .swagger-ui .info .title small { font-size: 10px; }
    .swagger-ui .scheme-container { background: #f7f7f7; padding: 10px 0; margin: 0 0 20px; }
  `,
  customSiteTitle: 'IFTA Easy Tax API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    persistAuthorization: true,
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    defaultModelRendering: 'model',
    displayRequestDuration: true,
    tryItOutEnabled: true
  }
};

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, swaggerUiOptions),
  specs,
  options: swaggerUiOptions
};
