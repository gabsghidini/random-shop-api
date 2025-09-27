import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class Cors {
  public async handle(
    { request, response }: HttpContextContract,
    next: () => Promise<void>
  ) {
    // Set CORS headers
    response.header('Access-Control-Allow-Origin', '*')
    response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
    response.header('Access-Control-Max-Age', '86400')

    // Handle preflight requests
    if (request.method() === 'OPTIONS') {
      return response.status(200).send('')
    }

    await next()
  }
}