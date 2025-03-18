import swaggerJsdoc from 'swagger-jsdoc';
import { version } from './package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Service Template API',
      version,
      description: 'API service template',
      license: {
        name: 'SEE LICENCE IN LICENCE',
        url: 'https://github.com/user/repo/blob/main/LICENCE',
      },
      contact: {
        name: 'API Support',
        email: 'your-email@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Enter your JWT token in the format: Bearer {your-token}',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    paths: {
      '/docs': {
        get: {
          security: [],
          responses: {
            '200': {
              description: 'Swagger UI',
            },
          },
        },
      },
      '/docs/swagger.json': {
        get: {
          security: [],
          responses: {
            '200': {
              description: 'OpenAPI specification',
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.ts', './src/entities/*.ts', './swagger/**/*.yaml'],
};

export const specs = swaggerJsdoc(options);
