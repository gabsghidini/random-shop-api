import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'
import Item from 'App/Models/Item'
import Compra from 'App/Models/Compra'

test.group('Item Model', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('should create an item with valid data', async ({ assert }) => {
    const itemData = {
      nome: 'Test Item',
      preco: 29.99,
      qtdAtual: 10
    }

    const item = await Item.create(itemData)

    assert.exists(item.id)
    assert.equal(item.nome, itemData.nome)
    assert.equal(item.preco, itemData.preco)
    assert.equal(item.qtdAtual, itemData.qtdAtual)
    assert.exists(item.createdAt)
    assert.exists(item.updatedAt)
  })

  test('should have proper column definitions', async ({ assert }) => {
    const item = new Item()
    
    // Check that the model has the expected columns
    assert.property(item, 'id')
    assert.property(item, 'nome')
    assert.property(item, 'preco')
    assert.property(item, 'qtdAtual')
    assert.property(item, 'createdAt')
    assert.property(item, 'updatedAt')
  })

  test('should have hasMany relationship with Compra', async ({ assert }) => {
    const item = await Item.create({
      nome: 'Test Item',
      preco: 19.99,
      qtdAtual: 5
    })

    // Create some compras for this item
    await Compra.create({
      compradorGithubLogin: 'testuser1',
      itemId: item.id
    })

    await Compra.create({
      compradorGithubLogin: 'testuser2',
      itemId: item.id
    })

    // Load the relationship
    await item.load('compras')

    assert.equal(item.compras.length, 2)
    assert.equal(item.compras[0].itemId, item.id)
    assert.equal(item.compras[1].itemId, item.id)
  })

  test('should update timestamps on modification', async ({ assert }) => {
    const item = await Item.create({
      nome: 'Test Item',
      preco: 15.99,
      qtdAtual: 3
    })

    const originalUpdatedAt = item.updatedAt

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10))

    item.nome = 'Updated Item'
    await item.save()

    assert.notEqual(item.updatedAt.toISO(), originalUpdatedAt.toISO())
  })

  test('should be able to query items', async ({ assert }) => {
    await Item.create({
      nome: 'Item 1',
      preco: 10.00,
      qtdAtual: 5
    })

    await Item.create({
      nome: 'Item 2',
      preco: 20.00,
      qtdAtual: 0
    })

    const allItems = await Item.all()
    assert.equal(allItems.length, 2)

    const availableItems = await Item.query().where('qtdAtual', '>', 0)
    assert.equal(availableItems.length, 1)
    assert.equal(availableItems[0].nome, 'Item 1')
  })

  test('should handle decimal prices correctly', async ({ assert }) => {
    const item = await Item.create({
      nome: 'Decimal Test',
      preco: 99.99,
      qtdAtual: 1
    })

    assert.equal(item.preco, 99.99)

    // Test with more decimal places
    const item2 = await Item.create({
      nome: 'Decimal Test 2',
      preco: 123.456,
      qtdAtual: 1
    })

    // Should handle decimal precision
    assert.approximately(item2.preco, 123.456, 0.001)
  })

  test('should handle zero quantity', async ({ assert }) => {
    const item = await Item.create({
      nome: 'Zero Stock Item',
      preco: 50.00,
      qtdAtual: 0
    })

    assert.equal(item.qtdAtual, 0)
  })
})