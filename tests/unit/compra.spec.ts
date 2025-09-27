import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'
import Item from 'App/Models/Item'
import Compra from 'App/Models/Compra'

test.group('Compra Model', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('should create a compra with valid data', async ({ assert }) => {
    // First create an item
    const item = await Item.create({
      nome: 'Test Item',
      preco: 25.99,
      qtdAtual: 5
    })

    const compraData = {
      compradorGithubLogin: 'testuser',
      itemId: item.id
    }

    const compra = await Compra.create(compraData)

    assert.exists(compra.id)
    assert.equal(compra.compradorGithubLogin, compraData.compradorGithubLogin)
    assert.equal(compra.itemId, compraData.itemId)
    assert.exists(compra.createdAt)
    assert.exists(compra.updatedAt)
  })

  test('should have proper column definitions', async ({ assert }) => {
    const compra = new Compra()
    
    // Check that the model has the expected columns
    assert.property(compra, 'id')
    assert.property(compra, 'compradorGithubLogin')
    assert.property(compra, 'itemId')
    assert.property(compra, 'createdAt')
    assert.property(compra, 'updatedAt')
  })

  test('should have belongsTo relationship with Item', async ({ assert }) => {
    // Create an item first
    const item = await Item.create({
      nome: 'Test Item',
      preco: 35.99,
      qtdAtual: 3
    })

    // Create a compra
    const compra = await Compra.create({
      compradorGithubLogin: 'relationshiptest',
      itemId: item.id
    })

    // Load the relationship
    await compra.load('item')

    assert.exists(compra.item)
    assert.equal(compra.item.id, item.id)
    assert.equal(compra.item.nome, 'Test Item')
    assert.equal(compra.item.preco, 35.99)
  })

  test('should update timestamps on modification', async ({ assert }) => {
    const item = await Item.create({
      nome: 'Test Item',
      preco: 15.99,
      qtdAtual: 2
    })

    const compra = await Compra.create({
      compradorGithubLogin: 'timestamptest',
      itemId: item.id
    })

    const originalUpdatedAt = compra.updatedAt

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10))

    compra.compradorGithubLogin = 'updateduser'
    await compra.save()

    assert.notEqual(compra.updatedAt.toISO(), originalUpdatedAt.toISO())
  })

  test('should be able to query compras with item data', async ({ assert }) => {
    // Create items
    const item1 = await Item.create({
      nome: 'Item 1',
      preco: 10.00,
      qtdAtual: 5
    })

    const item2 = await Item.create({
      nome: 'Item 2',
      preco: 20.00,
      qtdAtual: 3
    })

    // Create compras
    await Compra.create({
      compradorGithubLogin: 'user1',
      itemId: item1.id
    })

    await Compra.create({
      compradorGithubLogin: 'user2',
      itemId: item2.id
    })

    await Compra.create({
      compradorGithubLogin: 'user3',
      itemId: item1.id
    })

    // Query all compras
    const allCompras = await Compra.all()
    assert.equal(allCompras.length, 3)

    // Query compras for specific item
    const item1Compras = await Compra.query().where('itemId', item1.id)
    assert.equal(item1Compras.length, 2)

    // Query compras with preloaded item data
    const comprasWithItems = await Compra.query().preload('item')
    assert.equal(comprasWithItems.length, 3)
    
    comprasWithItems.forEach(compra => {
      assert.exists(compra.item)
      assert.exists(compra.item.nome)
      assert.exists(compra.item.preco)
    })
  })

  test('should handle GitHub login strings correctly', async ({ assert }) => {
    const item = await Item.create({
      nome: 'GitHub Test Item',
      preco: 45.00,
      qtdAtual: 1
    })

    // Test with various GitHub login formats
    const testLogins = [
      'simple-user',
      'user_with_underscores',
      'UserWithCaps',
      'user123',
      'a-very-long-github-username-that-should-still-work'
    ]

    for (const login of testLogins) {
      const compra = await Compra.create({
        compradorGithubLogin: login,
        itemId: item.id
      })

      assert.equal(compra.compradorGithubLogin, login)
    }
  })

  test('should maintain referential integrity with items', async ({ assert }) => {
    const item = await Item.create({
      nome: 'Integrity Test Item',
      preco: 30.00,
      qtdAtual: 2
    })

    const compra = await Compra.create({
      compradorGithubLogin: 'integrityuser',
      itemId: item.id
    })

    // Verify the compra references the correct item
    assert.equal(compra.itemId, item.id)

    // Load the relationship and verify data integrity
    await compra.load('item')
    assert.equal(compra.item.id, item.id)
    assert.equal(compra.item.nome, 'Integrity Test Item')
  })

  test('should be able to count compras per item', async ({ assert }) => {
    const item = await Item.create({
      nome: 'Popular Item',
      preco: 15.00,
      qtdAtual: 10
    })

    // Create multiple compras for the same item
    const buyers = ['buyer1', 'buyer2', 'buyer3', 'buyer4']
    
    for (const buyer of buyers) {
      await Compra.create({
        compradorGithubLogin: buyer,
        itemId: item.id
      })
    }

    const compraCount = await Compra.query().where('itemId', item.id).count('* as total')
    assert.equal(compraCount[0].$extras.total, 4)
  })
})