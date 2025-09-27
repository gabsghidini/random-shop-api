import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'

export default class RequestLogger {
  public async handle(
    { request, response }: HttpContextContract,
    next: () => Promise<void>
  ) {
    const startTime = Date.now()
    
    // Log incoming request
    Logger.info('Incoming request', {
      method: request.method(),
      url: request.url(),
      ip: request.ip(),
      userAgent: request.header('user-agent'),
      timestamp: new Date().toISOString()
    })

    await next()

    const duration = Date.now() - startTime
    
    // Log response
    Logger.info('Request completed', {
      method: request.method(),
      url: request.url(),
      statusCode: response.getStatus(),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    })
  }
}