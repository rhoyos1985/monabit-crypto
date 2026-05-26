import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MonaBit Dashboard API',
      version: '1.0.0',
      description:
        'API para el dashboard de criptomonedas. Autenticación con JWT, gestión de usuarios y datos del mercado cripto.',
      contact: {
        name: 'MonaBit Team',
        url: 'https://monabit.dev',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:8080',
        description: 'Backend server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from /auth/login or /auth/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            displayName: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['admin', 'user'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
        },
        AuthToken: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string', nullable: true },
            expires_in: { type: 'number' },
            token_type: { type: 'string', default: 'Bearer' },
          },
          required: ['access_token', 'expires_in', 'token_type'],
        },
        AuthResponse: {
          type: 'object',
          properties: {
            httpStatus: { type: 'string', example: '201 - Created' },
            apiMessage: { type: 'string' },
            apiData: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: { $ref: '#/components/schemas/AuthToken' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            httpStatus: { type: 'string', example: '400 - Bad Request' },
            apiMessage: { type: 'string' },
            apiData: { type: 'null' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: {
              type: 'object',
              properties: {
                fieldErrors: { type: 'object' },
                formErrors: { type: 'array' },
              },
            },
          },
        },
      },
    },
    security: [],
  },
  apis: ['./src/modules/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
