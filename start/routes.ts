import Route from '@ioc:Adonis/Core/Route'
import { swaggerSpec } from 'Config/autoswagger'
import swaggerUi from 'swagger-ui-express'

Route.get('/', async () => {
  return { hello: 'world' }
})

// Swagger routes
Route.get('/swagger.json', async ({ response }) => {
  return response.json(swaggerSpec)
})

Route.get('/docs', async ({ response }) => {
  const html = swaggerUi.generateHTML(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Random Shopping API Documentation'
  })
  response.header('Content-Type', 'text/html')
  return html
})

// Health check route
Route.get('/health', 'HealthController.check')

// Items routes
Route.get('/itens', 'ItemsController.index')
Route.post('/itens', 'ItemsController.store')

// Compras routes
Route.get('/compras', 'ComprasController.index')
Route.post('/compras', 'ComprasController.store')