import Logger from '@ioc:Adonis/Core/Logger'
import HttpExceptionHandler from '@ioc:Adonis/Core/HttpExceptionHandler'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ItemNotFoundException from 'App/Exceptions/ItemNotFoundException'
import InsufficientStockException from 'App/Exceptions/InsufficientStockException'
import GitHubApiException from 'App/Exceptions/GitHubApiException'

export default class ExceptionHandler extends HttpExceptionHandler {
  constructor () {
    super(Logger)
  }

  public async handle(error: any, ctx: HttpContextContract) {
    // Log all errors with detailed context
    this.logError(error, ctx)

    /**
     * Handle custom exceptions with structured error responses
     */
    if (error instanceof ItemNotFoundException) {
      return ctx.response.status(404).json({
        error: {
          code: 'ITEM_NOT_FOUND',
          message: error.message,
          details: {
            item_id: this.extractItemIdFromMessage(error.message)
          }
        }
      })
    }

    if (error instanceof InsufficientStockException) {
      return ctx.response.status(422).json({
        error: {
          code: 'INSUFFICIENT_STOCK',
          message: error.message,
          details: {
            item_id: this.extractItemIdFromMessage(error.message)
          }
        }
      })
    }

    if (error instanceof GitHubApiException) {
      return ctx.response.status(503).json({
        error: {
          code: 'GITHUB_API_ERROR',
          message: error.message,
          details: {
            service: 'GitHub API'
          }
        }
      })
    }

    /**
     * Handle validation errors
     */
    if (error.code === 'E_VALIDATION_FAILURE') {
      return ctx.response.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.messages
        }
      })
    }

    /**
     * Handle route not found errors
     */
    if (error.code === 'E_ROUTE_NOT_FOUND') {
      return ctx.response.status(404).json({
        error: {
          code: 'ROUTE_NOT_FOUND',
          message: 'Route not found',
          details: {
            url: ctx.request.url(),
            method: ctx.request.method()
          }
        }
      })
    }

    /**
     * Handle method not allowed errors
     */
    if (error.code === 'E_HTTP_METHOD_NOT_ALLOWED') {
      return ctx.response.status(405).json({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'HTTP method not allowed',
          details: {
            method: ctx.request.method(),
            url: ctx.request.url()
          }
        }
      })
    }

    /**
     * Handle database errors
     */
    if (error.code && error.code.startsWith('SQLITE_')) {
      return ctx.response.status(500).json({
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: {
            type: 'SQLite Error'
          }
        }
      })
    }

    /**
     * Handle all other errors with generic response
     */
    return ctx.response.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        details: {
          timestamp: new Date().toISOString()
        }
      }
    })
  }

  /**
   * Log error with detailed context information
   */
  private logError(error: any, ctx: HttpContextContract) {
    const errorContext = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack
      },
      request: {
        method: ctx.request.method(),
        url: ctx.request.url(),
        ip: ctx.request.ip(),
        userAgent: ctx.request.header('user-agent'),
        body: ctx.request.body(),
        params: ctx.request.params(),
        query: ctx.request.qs()
      },
      timestamp: new Date().toISOString()
    }

    // Log different levels based on error type
    if (error instanceof ItemNotFoundException || 
        error instanceof InsufficientStockException ||
        error.code === 'E_VALIDATION_FAILURE') {
      Logger.warn('Business logic error', errorContext)
    } else if (error instanceof GitHubApiException) {
      Logger.error('External service error', errorContext)
    } else if (error.code === 'E_ROUTE_NOT_FOUND' || 
               error.code === 'E_HTTP_METHOD_NOT_ALLOWED') {
      Logger.info('Client error', errorContext)
    } else {
      Logger.error('Unexpected error', errorContext)
    }
  }

  /**
   * Extract item ID from error message for structured error response
   */
  private extractItemIdFromMessage(message: string): number | null {
    const match = message.match(/ID:?\s*(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }
}