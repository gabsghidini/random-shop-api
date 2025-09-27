import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'
import { ItemFactory } from 'Database/factories'

test.group('Items API', (group) => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    return () => Database.rollbackGlobalTransaction()
  })

  test('POST /itens should create a new item with valid data', async ({ client, assert }) => {
    const itemData = {
      nome: 'Test Product',
      preco: 29.99,
      qtd_atual: 10
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(201)
    response.assertBodyContains({
      nome: 'Test Product',
      preco: 29.99,
      qtd_atual: 10
    })

    const responseBody = response.body()
    assert.exists(responseBody.id)
    assert.exists(responseBody.created_at)
    assert.exists(responseBody.updated_at)
  })

  test('POST /itens should validate required fields', async ({ client, assert }) => {
    const response = await client.post('/itens').json({})

    response.assertStatus(422)
    
    const responseBody = response.body()
    assert.exists(responseBody.errors)
    
    // Check that validation errors are returned for required fields
    const errors = responseBody.errors
    assert.isTrue(errors.some(error => error.field === 'nome'))
    assert.isTrue(errors.some(error => error.field === 'preco'))
    assert.isTrue(errors.some(error => error.field === 'qtd_atual'))
  })

  test('POST /itens should validate nome is a string', async ({ client, assert }) => {
    const itemData = {
      nome: 123, // Invalid: should be string
      preco: 29.99,
      qtd_atual: 10
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(422)
    
    const responseBody = response.body()
    const nomeError = responseBody.errors.find(error => error.field === 'nome')
    assert.exists(nomeError)
    assert.include(nomeError.message.toLowerCase(), 'string')
  })

  test('POST /itens should validate preco is a positive number', async ({ client, assert }) => {
    const itemData = {
      nome: 'Test Product',
      preco: -10.50, // Invalid: negative price
      qtd_atual: 5
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(422)
    
    const responseBody = response.body()
    const precoError = responseBody.errors.find(error => error.field === 'preco')
    assert.exists(precoError)
  })

  test('POST /itens should validate preco is a number', async ({ client, assert }) => {
    const itemData = {
      nome: 'Test Product',
      preco: 'not-a-number', // Invalid: should be number
      qtd_atual: 5
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(422)
    
    const responseBody = response.body()
    const precoError = responseBody.errors.find(error => error.field === 'preco')
    assert.exists(precoError)
  })

  test('POST /itens should validate qtd_atual is a non-negative integer', async ({ client, assert }) => {
    const itemData = {
      nome: 'Test Product',
      preco: 25.99,
      qtd_atual: -5 // Invalid: negative quantity
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(422)
    
    const responseBody = response.body()
    const qtdError = responseBody.errors.find(error => error.field === 'qtd_atual')
    assert.exists(qtdError)
  })

  test('POST /itens should validate qtd_atual is an integer', async ({ client, assert }) => {
    const itemData = {
      nome: 'Test Product',
      preco: 25.99,
      qtd_atual: 'not-a-number' // Invalid: should be integer
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(422)
    
    const responseBody = response.body()
    const qtdError = responseBody.errors.find(error => error.field === 'qtd_atual')
    assert.exists(qtdError)
  })

  test('POST /itens should accept zero quantity', async ({ client, assert }) => {
    const itemData = {
      nome: 'Out of Stock Item',
      preco: 15.99,
      qtd_atual: 0
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(201)
    response.assertBodyContains({
      nome: 'Out of Stock Item',
      preco: 15.99,
      qtd_atual: 0
    })
  })

  test('POST /itens should handle decimal prices correctly', async ({ client, assert }) => {
    const itemData = {
      nome: 'Decimal Price Item',
      preco: 99.99,
      qtd_atual: 3
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(201)
    response.assertBodyContains({
      preco: 99.99
    })
  })

  test('GET /itens should return empty array when no items exist', async ({ client, assert }) => {
    const response = await client.get('/itens')

    response.assertStatus(200)
    response.assertBody([])
  })

  test('GET /itens should return all items', async ({ client, assert }) => {
    // Create test items using factory
    const items = await ItemFactory.createMany(3)

    const response = await client.get('/itens')

    response.assertStatus(200)
    
    const responseBody = response.body()
    assert.isArray(responseBody)
    assert.equal(responseBody.length, 3)

    // Verify each item has the expected structure
    responseBody.forEach(item => {
      assert.exists(item.id)
      assert.exists(item.nome)
      assert.exists(item.preco)
      assert.exists(item.qtd_atual)
      assert.exists(item.created_at)
      assert.exists(item.updated_at)
    })

    // Verify the items match what we created
    const createdIds = items.map(item => item.id).sort()
    const responseIds = responseBody.map(item => item.id).sort()
    assert.deepEqual(responseIds, createdIds)
  })

  test('GET /itens should return items in consistent format', async ({ client, assert }) => {
    await ItemFactory.merge({
      nome: 'Consistent Format Test',
      preco: 42.50,
      qtd_atual: 7
    }).create()

    const response = await client.get('/itens')

    response.assertStatus(200)
    
    const responseBody = response.body()
    assert.equal(responseBody.length, 1)

    const item = responseBody[0]
    assert.equal(item.nome, 'Consistent Format Test')
    assert.equal(item.preco, 42.50)
    assert.equal(item.qtd_atual, 7)
    assert.isNumber(item.id)
    assert.isString(item.created_at)
    assert.isString(item.updated_at)
  })

  test('GET /itens should handle large number of items', async ({ client, assert }) => {
    // Create many items
    await ItemFactory.createMany(50)

    const response = await client.get('/itens')

    response.assertStatus(200)
    
    const responseBody = response.body()
    assert.equal(responseBody.length, 50)
  })

  test('POST /itens should handle special characters in nome', async ({ client, assert }) => {
    const itemData = {
      nome: 'Special Chars: áéíóú ñ ç & @ # $ % !',
      preco: 19.99,
      qtd_atual: 2
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(201)
    response.assertBodyContains({
      nome: 'Special Chars: áéíóú ñ ç & @ # $ % !'
    })
  })

  test('POST /itens should handle very long item names', async ({ client, assert }) => {
    const longName = 'A'.repeat(255) // Very long name
    const itemData = {
      nome: longName,
      preco: 29.99,
      qtd_atual: 1
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(201)
    response.assertBodyContains({
      nome: longName
    })
  })

  test('POST /itens should handle very large quantities', async ({ client, assert }) => {
    const itemData = {
      nome: 'Large Quantity Item',
      preco: 5.99,
      qtd_atual: 999999
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(201)
    response.assertBodyContains({
      qtd_atual: 999999
    })
  })

  test('POST /itens should handle very high prices', async ({ client, assert }) => {
    const itemData = {
      nome: 'Expensive Item',
      preco: 9999.99,
      qtd_atual: 1
    }

    const response = await client.post('/itens').json(itemData)

    response.assertStatus(201)
    response.assertBodyContains({
      preco: 9999.99
    })
  })

  test('Items endpoints should handle concurrent requests', async ({ client, assert }) => {
    // Create multiple items concurrently
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(
        client.post('/itens').json({
          nome: `Concurrent Item ${i}`,
          preco: 10.00 + i,
          qtd_atual: i + 1
        })
      )
    }

    const responses = await Promise.all(promises)

    // All should succeed
    responses.forEach(response => {
      response.assertStatus(201)
    })

    // Verify all items were created
    const getResponse = await client.get('/itens')
    getResponse.assertStatus(200)
    
    const items = getResponse.body()
    assert.equal(items.length, 5)
  })
})