import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'
import { ItemFactory, CompraFactory } from 'Database/factories'

test.group('Model Factories', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('ItemFactory should create valid items', async ({ assert }) => {
    const item = await ItemFactory.create()

    assert.exists(item.id)
    assert.isString(item.nome)
    assert.isNumber(item.preco)
    assert.isNumber(item.qtdAtual)
    assert.isTrue(item.preco > 0)
    assert.isTrue(item.qtdAtual >= 0)
    assert.exists(item.createdAt)
    assert.exists(item.updatedAt)
  })

  test('ItemFactory should create multiple items', async ({ assert }) => {
    const items = await ItemFactory.createMany(5)

    assert.equal(items.length, 5)
    
    items.forEach(item => {
      assert.exists(item.id)
      assert.isString(item.nome)
      assert.isNumber(item.preco)
      assert.isNumber(item.qtdAtual)
    })

    // Verify all items have unique IDs
    const ids = items.map(item => item.id)
    const uniqueIds = [...new Set(ids)]
    assert.equal(ids.length, uniqueIds.length)
  })

  test('CompraFactory should create valid compras', async ({ assert }) => {
    // First create an item to reference
    const item = await ItemFactory.create()

    const compra = await CompraFactory.merge({ itemId: item.id }).create()

    assert.exists(compra.id)
    assert.isString(compra.compradorGithubLogin)
    assert.equal(compra.itemId, item.id)
    assert.exists(compra.createdAt)
    assert.exists(compra.updatedAt)

    // Verify GitHub login format (should be lowercase and contain only valid characters)
    assert.match(compra.compradorGithubLogin, /^[a-z0-9-]+$/)
  })

  test('CompraFactory should create multiple compras', async ({ assert }) => {
    const item = await ItemFactory.create()

    const compras = await CompraFactory.merge({ itemId: item.id }).createMany(3)

    assert.equal(compras.length, 3)
    
    compras.forEach(compra => {
      assert.exists(compra.id)
      assert.isString(compra.compradorGithubLogin)
      assert.equal(compra.itemId, item.id)
    })

    // Verify all compras have unique IDs
    const ids = compras.map(compra => compra.id)
    const uniqueIds = [...new Set(ids)]
    assert.equal(ids.length, uniqueIds.length)
  })

  test('Factories should work together for complex scenarios', async ({ assert }) => {
    // Create multiple items
    const items = await ItemFactory.createMany(3)

    // Create compras for each item
    const allCompras = []
    for (const item of items) {
      const compras = await CompraFactory.merge({ itemId: item.id }).createMany(2)
      allCompras.push(...compras)
    }

    assert.equal(allCompras.length, 6)

    // Verify each compra references a valid item
    for (const compra of allCompras) {
      const referencedItem = items.find(item => item.id === compra.itemId)
      assert.exists(referencedItem)
    }
  })

  test('ItemFactory should handle custom attributes', async ({ assert }) => {
    const customItem = await ItemFactory.merge({
      nome: 'Custom Test Item',
      preco: 99.99,
      qtdAtual: 42
    }).create()

    assert.equal(customItem.nome, 'Custom Test Item')
    assert.equal(customItem.preco, 99.99)
    assert.equal(customItem.qtdAtual, 42)
  })

  test('CompraFactory should handle custom GitHub logins', async ({ assert }) => {
    const item = await ItemFactory.create()

    const customCompra = await CompraFactory.merge({
      itemId: item.id,
      compradorGithubLogin: 'custom-test-user'
    }).create()

    assert.equal(customCompra.compradorGithubLogin, 'custom-test-user')
    assert.equal(customCompra.itemId, item.id)
  })
})