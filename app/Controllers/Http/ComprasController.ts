import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Compra from 'App/Models/Compra'
import Item from 'App/Models/Item'
import CreateCompraValidator from 'App/Validators/CreateCompraValidator'
import GitHubService, { GitHubApiException } from 'App/Services/GitHubService'

export default class ComprasController {
  private gitHubService = new GitHubService()

  /**
   * @swagger
   * /compras:
   *   get:
   *     tags:
   *       - Compras
   *     summary: List all purchases
   *     description: Retrieves all purchases with related item data
   *     responses:
   *       200:
   *         description: Purchases retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Compras recuperadas com sucesso
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                         example: 1
   *                       comprador_github_login:
   *                         type: string
   *                         example: octocat
   *                       item:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                             example: 1
   *                           nome:
   *                             type: string
   *                             example: Smartphone
   *                           preco:
   *                             type: number
   *                             format: float
   *                             example: 999.99
   *                           qtd_atual:
   *                             type: integer
   *                             example: 9
   *                       created_at:
   *                         type: string
   *                         format: date-time
   *                       updated_at:
   *                         type: string
   *                         format: date-time
   */
  public async index({ response }: HttpContextContract) {
    // Retrieve purchases with related item data using Lucid relationships
    const compras = await Compra.query()
      .preload('item')
      .orderBy('created_at', 'desc')

    // Return purchases with complete item information
    const formattedCompras = compras.map(compra => ({
      id: compra.id,
      comprador_github_login: compra.compradorGithubLogin,
      item: {
        id: compra.item.id,
        nome: compra.item.nome,
        preco: compra.item.preco,
        qtd_atual: compra.item.qtdAtual
      },
      created_at: compra.createdAt,
      updated_at: compra.updatedAt
    }))

    return response.json({
      message: 'Compras recuperadas com sucesso',
      data: formattedCompras
    })
  }

  /**
   * @swagger
   * /compras:
   *   post:
   *     tags:
   *       - Compras
   *     summary: Create a new purchase
   *     description: Creates a new purchase with random GitHub user assignment
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - item_id
   *             properties:
   *               item_id:
   *                 type: integer
   *                 description: ID of the item to purchase
   *                 example: 1
   *     responses:
   *       201:
   *         description: Purchase created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Compra realizada com sucesso
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     comprador_github_login:
   *                       type: string
   *                       example: octocat
   *                     item:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: integer
   *                           example: 1
   *                         nome:
   *                           type: string
   *                           example: Smartphone
   *                         preco:
   *                           type: number
   *                           format: float
   *                           example: 999.99
   *                         qtd_atual:
   *                           type: integer
   *                           example: 9
   *                     created_at:
   *                       type: string
   *                       format: date-time
   *                     updated_at:
   *                       type: string
   *                       format: date-time
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       field:
   *                         type: string
   *                       rule:
   *                         type: string
   *                       message:
   *                         type: string
   *       404:
   *         description: Item not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                       example: ITEM_NOT_FOUND
   *                     message:
   *                       type: string
   *                       example: Item não encontrado
   *                     details:
   *                       type: object
   *                       properties:
   *                         item_id:
   *                           type: integer
   *                           example: 1
   *       422:
   *         description: Insufficient stock
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                       example: INSUFFICIENT_STOCK
   *                     message:
   *                       type: string
   *                       example: Item sem estoque disponível
   *                     details:
   *                       type: object
   *                       properties:
   *                         item_id:
   *                           type: integer
   *                           example: 1
   *                         current_stock:
   *                           type: integer
   *                           example: 0
   *       503:
   *         description: External service error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: object
   *                   properties:
   *                     code:
   *                       type: string
   *                       example: GITHUB_API_ERROR
   *                     message:
   *                       type: string
   *                       example: Erro ao conectar com serviço externo
   *                     details:
   *                       type: object
   *                       properties:
   *                         service:
   *                           type: string
   *                           example: GitHub API
   */
  public async store({ request, response }: HttpContextContract) {
    // Validate the request data using CreateCompraValidator
    const payload = await request.validate(CreateCompraValidator)

    // Use database transaction to ensure data consistency
    const trx = await Database.transaction()

    try {
      // Find the item and lock it for update to prevent race conditions
      const item = await Item.query({ client: trx })
        .where('id', payload.item_id)
        .forUpdate()
        .first()

      // Validate that the item exists (this should be caught by validator, but double-check)
      if (!item) {
        await trx.rollback()
        return response.status(404).json({
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item não encontrado',
            details: {
              item_id: payload.item_id
            }
          }
        })
      }

      // Validate that the item has available quantity
      if (item.qtdAtual <= 0) {
        await trx.rollback()
        return response.status(422).json({
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: 'Item sem estoque disponível',
            details: {
              item_id: payload.item_id,
              current_stock: item.qtdAtual
            }
          }
        })
      }

      // Integrate with GitHubService to get random user
      let githubUser
      try {
        githubUser = await this.gitHubService.getRandomUser()
      } catch (error) {
        await trx.rollback()
        
        if (error instanceof GitHubApiException) {
          return response.status(error.status).json({
            error: {
              code: 'GITHUB_API_ERROR',
              message: error.message,
              details: {
                service: 'GitHub API'
              }
            }
          })
        }
        
        // Unexpected error
        return response.status(503).json({
          error: {
            code: 'EXTERNAL_SERVICE_ERROR',
            message: 'Erro ao conectar com serviço externo',
            details: {
              service: 'GitHub API'
            }
          }
        })
      }

      // Create purchase record
      const compra = await Compra.create({
        compradorGithubLogin: githubUser.login,
        itemId: item.id
      }, { client: trx })

      // Decrement item quantity by 1
      item.qtdAtual = item.qtdAtual - 1
      await item.save({ client: trx })

      // Commit the transaction
      await trx.commit()

      // Load the item relationship for the response
      await compra.load('item')

      // Return purchase with item and buyer details
      return response.status(201).json({
        message: 'Compra realizada com sucesso',
        data: {
          id: compra.id,
          comprador_github_login: compra.compradorGithubLogin,
          item: {
            id: compra.item.id,
            nome: compra.item.nome,
            preco: compra.item.preco,
            qtd_atual: compra.item.qtdAtual
          },
          created_at: compra.createdAt,
          updated_at: compra.updatedAt
        }
      })

    } catch (error) {
      // Rollback transaction on any error
      await trx.rollback()
      throw error
    }
  }
}