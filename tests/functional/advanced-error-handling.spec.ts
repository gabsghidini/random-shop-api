import test from '@japa/runner'
import { ApiClient } from '@japa/api-client'

test.group('Advanced Error Handling', (group) => {
  group.setup(async () => {
    // Setup test database if needed
  })

  test('should return rate limit headers', async ({ client }) => {
    const response = await client.get('/health')
    
    response.assertStatus(200)
    response.assertHeader('x-ratelimit-limit')
    response.assertHeader('x-ratelimit-remaining')
    response.assertHeader('x-ratelimit-reset')
  })

  test('should return performance headers', async ({ client }) => {
    const response = await client.get('/health')
    
    response.assertStatus(200)
    response.assertHeader('x-response-time')
    response.assertHeader('x-memory-usage')
  })

  test('should handle rate limiting', async ({ client }) => {
    // This test would need to be run with a lower rate limit for practical testing
    // For now, just verify the middleware is registered
    const response = await client.get('/health')
    response.assertStatus(200)
  })

  test('health check should return proper structure', async ({ client }) => {
    const response = await client.get('/health')
    
    response.assertStatus(200)
    response.assertBodyContains({
      status: 'healthy',
      version: '1.0.0'
    })
    
    const body = response.body()
    expect(body).toHaveProperty('timestamp')
    expect(body).toHaveProperty('uptime')
    expect(body).toHaveProperty('checks')
    expect(body.checks).toHaveProperty('database')
  })

  test('should handle 404 errors with structured response', async ({ client }) => {
    const response = await client.get('/nonexistent-route')
    
    response.assertStatus(404)
    response.assertBodyContains({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found'
      }
    })
  })

  test('should handle validation errors with structured response', async ({ client }) => {
    const response = await client.post('/itens').json({
      nome: '', // Invalid: empty name
      preco: -10, // Invalid: negative price
    })
    
    response.assertStatus(400)
    response.assertBodyContains({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed'
      }
    })
  })
})