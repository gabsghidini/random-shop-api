import swaggerJSDoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Random Shopping API',
      version: '1.0.0',
      description: 'A REST API system that manages a product catalog and shopping list functionality with GitHub integration',
    },
    servers: [
      {
        url: 'http://localhost:3333',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
    },
  },
  apis: [
    './app/Controllers/Http/*.ts',
    './start/routes.ts',
  ],
}

export const swaggerSpec = swaggerJSDoc(options)

export default {
  uiEnabled: true,
  uiUrl: '/docs',
  specEnabled: true,
  specUrl: '/swagger.json',
}