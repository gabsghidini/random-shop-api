import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'

export default class PerformanceMonitor {
  public async handle(
    { request, response }: HttpContextContract,
    next: () => Promise<void>
  ) {
    const startTime = process.hrtime.bigint()
    const startMemory = process.memoryUsage()

    await next()

    const endTime = process.hrtime.bigint()
    const endMemory = process.memoryUsage()
    
    const duration = Number(endTime - startTime) / 1000000 // Convert to milliseconds
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    }

    // Add performance headers
    response.header('X-Response-Time', `${duration.toFixed(2)}ms`)
    response.header('X-Memory-Usage', `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)

    // Log slow requests (> 1000ms)
    if (duration > 1000) {
      Logger.warn('Slow request detected', {
        method: request.method(),
        url: request.url(),
        duration: `${duration.toFixed(2)}ms`,
        statusCode: response.getStatus(),
        memoryDelta,
        timestamp: new Date().toISOString()
      })
    }

    // Log performance metrics for monitoring
    Logger.debug('Request performance', {
      method: request.method(),
      url: request.url(),
      duration: `${duration.toFixed(2)}ms`,
      statusCode: response.getStatus(),
      memoryUsage: {
        rss: `${(endMemory.rss / 1024 / 1024).toFixed(2)}MB`,
        heapUsed: `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(endMemory.heapTotal / 1024 / 1024).toFixed(2)}MB`
      },
      timestamp: new Date().toISOString()
    })
  }
}