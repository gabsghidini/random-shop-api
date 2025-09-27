import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Item from 'App/Models/Item'
import CreateItemValidator from 'App/Validators/CreateItemValidator'

export default class ItemsController {
  /**
   * @swagger
   * /itens:
   *   get:
   *     tags:
   *       - Items
   *     summary: List all items
   *     description: Retrieves all items from the catalog
   *     responses:
   *       200:
   *         description: Items retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Items retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                         example: 1
   *                       nome:
   *                         type: string
   *                         example: Smartphone
   *                       preco:
   *                         type: number
   *                         format: float
   *                         example: 999.99
   *                       qtd_atual:
   *                         type: integer
   *                         example: 10
   *                       created_at:
   *                         type: string
   *                         format: date-time
   *                       updated_at:
   *                         type: string
   *                         format: date-time
   */
  public async index({ response }: HttpContextContract) {
    // Retrieve all items from database
    const items = await Item.all()

    // Return items list with proper formatting
    return response.json({
      message: 'Items retrieved successfully',
      data: items
    })
  }

  /**
   * @swagger
   * /itens:
   *   post:
   *     tags:
   *       - Items
   *     summary: Create a new item
   *     description: Creates a new item in the catalog
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - nome
   *               - preco
   *               - qtd_atual
   *             properties:
   *               nome:
   *                 type: string
   *                 description: Item name
   *                 example: Smartphone
   *               preco:
   *                 type: number
   *                 format: float
   *                 description: Item price
   *                 minimum: 0.01
   *                 example: 999.99
   *               qtd_atual:
   *                 type: integer
   *                 description: Current quantity in stock
   *                 minimum: 0
   *                 example: 10
   *     responses:
   *       201:
   *         description: Item created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Item criado com sucesso
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                       example: 1
   *                     nome:
   *                       type: string
   *                       example: Smartphone
   *                     preco:
   *                       type: number
   *                       format: float
   *                       example: 999.99
   *                     qtd_atual:
   *                       type: integer
   *                       example: 10
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
   */
  public async store({ request, response }: HttpContextContract) {
    // Validate the request data using CreateItemValidator
    const payload = await request.validate(CreateItemValidator)

    // Create new item in database using validated data
    const item = await Item.create({
      nome: payload.nome,
      preco: payload.preco,
      qtdAtual: payload.qtdAtual
    })

    // Return created item with proper HTTP status (201 Created)
    return response.status(201).json({
      message: 'Item criado com sucesso',
      data: item
    })
  }
}