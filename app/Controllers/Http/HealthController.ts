import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Logger from '@ioc:Adonis/Core/Logger'

export default class HealthController {
  /**
   * @swagger
   * /health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Health check endpoint
   *     description: Returns the health status of the API and its dependencies
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: healthy
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 version:
   *                   type: string
   *                   example: 1.0.0
   *                 checks:
   *                   type: object
   *                   properties:
   *                     database:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           example: healthy
   *                         responseTime:
   *                           type: string
   *                           example: 5ms
   *       503:
   *         description: Service is unhealthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: unhealthy
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 checks:
   *                   type: object
   *                   properties:
   *                     database:
   *                       type: object
   *                       properties:
   *                         status:
   *                           type: string
   *                           example: unhealthy
   *                         error:
   *                           type: string
   */
  public async check({ response }: HttpContextContract) {
    const startTime = Date.now()
    const checks: any = {}
    let overallStatus = 'healthy'

    // Check database connectivity
    try {
      const dbStartTime = Date.now()
      await Database.rawQuery('SELECT 1')
      const dbEndTime = Date.now()
      
      checks.database = {
        status: 'healthy',
        responseTime: `${dbEndTime - dbStartTime}ms`
      }
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        error: error.message
      }
      overallStatus = 'unhealthy'
      
      Logger.error('Database health check failed', {
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }

    const responseData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      checks
    }

    const statusCode = overallStatus === 'healthy' ? 200 : 503
    
    Logger.info('Health check performed', {
      status: overallStatus,
      responseTime: `${Date.now() - startTime}ms`,
      checks
    })

    return response.status(statusCode).json(responseData)
  }
}