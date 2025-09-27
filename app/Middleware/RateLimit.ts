import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

export default class RateLimit {
  private static store: RateLimitStore = {}
  private static readonly WINDOW_MS = 15 * 60 * 1000 // 15 minutes
  private static readonly MAX_REQUESTS = 100 // Max requests per window

  public async handle(
    { request, response }: HttpContextContract,
    next: () => Promise<void>
  ) {
    const clientIp = request.ip()
    const now = Date.now()
    const windowStart = now - RateLimit.WINDOW_MS

    // Clean up old entries
    this.cleanupExpiredEntries(windowStart)

    // Get or create client entry
    if (!RateLimit.store[clientIp]) {
      RateLimit.store[clientIp] = {
        count: 0,
        resetTime: now + RateLimit.WINDOW_MS
      }
    }

    const clientData = RateLimit.store[clientIp]

    // Reset if window has expired
    if (now > clientData.resetTime) {
      clientData.count = 0
      clientData.resetTime = now + RateLimit.WINDOW_MS
    }

    // Check if limit exceeded
    if (clientData.count >= RateLimit.MAX_REQUESTS) {
      Logger.warn('Rate limit exceeded', {
        ip: clientIp,
        count: clientData.count,
        limit: RateLimit.MAX_REQUESTS,
        resetTime: new Date(clientData.resetTime).toISOString()
      })

      return response.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          details: {
            limit: RateLimit.MAX_REQUESTS,
            windowMs: RateLimit.WINDOW_MS,
            resetTime: new Date(clientData.resetTime).toISOString()
          }
        }
      })
    }

    // Increment counter
    clientData.count++

    // Add rate limit headers
    response.header('X-RateLimit-Limit', RateLimit.MAX_REQUESTS.toString())
    response.header('X-RateLimit-Remaining', (RateLimit.MAX_REQUESTS - clientData.count).toString())
    response.header('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString())

    await next()
  }

  private cleanupExpiredEntries(windowStart: number) {
    Object.keys(RateLimit.store).forEach(ip => {
      if (RateLimit.store[ip].resetTime < windowStart) {
        delete RateLimit.store[ip]
      }
    })
  }
}