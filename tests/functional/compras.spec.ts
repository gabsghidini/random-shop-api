import { test } from '@japa/runner'
import Database from '@ioc:Adonis/Lucid/Database'
import sinon from 'sinon'
import axios from 'axios'
import { ItemFactory, CompraFactory } from 'Database/factories'
import { GitHubUser } from 'App/Services/GitHubService'

test.group('Compras API', (group) => {
  let axiosStub: sinon.SinonStub

  group.each.setup(async () => {
    await Database.beginGlobalTransaction()
    
    // Mock GitHub API for consistent testing
    axiosStub = sinon.stub(axios, 'get')
    
    return () => {
      Database.rollbackGlobalTransaction()
      sinon.restore()
    }
  })

  test('POST /compras should create a purchase with valid item_id', async ({ client, assert }) => {
    // Create an item first
    const item = await ItemFactory.merge({
      nome: 'Test Purchase Item',
      preco: 25.99,
      qtd_atual: 5
    }).create()

    // Mock GitHub API response
    const mockUser: GitHubUser = {
      login: 'testbuyer',
      id: 12345,
      node_id: 'MDQ6VXNlcjEyMzQ1',
      avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/testbuyer',
      html_url: 'https://github.com/testbuyer',
      followers_url: 'https://api.github.com/users/testbuyer/followers',
      following_url: 'https://api.github.com/users/testbuyer/following{/other_user}',
      gists_url: 'https://api.github.com/users/testbuyer/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/testbuyer/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/testbuyer/subscriptions',
      organizations_url: 'https://api.github.com/users/testbuyer/orgs',
      repos_url: 'https://api.github.com/users/testbuyer/repos',
      events_url: 'https://api.github.com/users/testbuyer/events{/privacy}',
      received_events_url: 'https://api.github.com/users/testbuyer/received_events',
      type: 'User',
      site_admin: false
    }

    axiosStub.resolves({
      data: [mockUser],
      status: 200
    })

    const response = await client.post('/compras').json({
      item_id: item.id
    })

    response.assertStatus(201)
    
    const responseBody = response.body()
    assert.exists(responseBody.id)
    assert.equal(responseBody.comprador_github_login, 'testbuyer')
    assert.equal(responseBody.item_id, item.id)
    assert.exists(responseBody.created_at)
    assert.exists(responseBody.updated_at)

    // Should include item details
    assert.exists(responseBody.item)
    assert.equal(responseBody.item.id, item.id)
    assert.equal(responseBody.item.nome, 'Test Purchase Item')
    assert.equal(responseBody.item.preco, 25.99)

    // Verify item quantity was decremented
    await item.refresh()
    assert.equal(item.qtdAtual, 4)
  })

  test('POST /compras should validate required item_id field', async ({ client, assert }) => {
    const response = await client.post('/compras').json({})

    response.assertStatus(422)
    
    const responseBody = response.body()
    assert.exists(responseBody.errors)
    
    const itemIdError = responseBody.errors.find(error => error.field === 'item_id')
    assert.exists(itemIdError)
  })

  test('POST /compras should validate item_id is an integer', async ({ client, assert }) => {
    const response = await client.post('/compras').json({
      item_id: 'not-a-number'
    })

    response.assertStatus(422)
    
    const responseBody = response.body()
    const itemIdError = responseBody.errors.find(error => error.field === 'item_id')
    assert.exists(itemIdError)
  })

  test('POST /compras should return 404 for invalid item_id', async ({ client, assert }) => {
    const response = await client.post('/compras').json({
      item_id: 99999 // Non-existent item
    })

    response.assertStatus(404)
    
    const responseBody = response.body()
    assert.exists(responseBody.error)
    assert.include(responseBody.error.message.toLowerCase(), 'not found')
  })

  test('POST /compras should return error for zero stock item', async ({ client, assert }) => {
    // Create an item with zero stock
    const item = await ItemFactory.merge({
      nome: 'Out of Stock Item',
      preco: 15.99,
      qtd_atual: 0
    }).create()

    const response = await client.post('/compras').json({
      item_id: item.id
    })

    response.assertStatus(422)
    
    const responseBody = response.body()
    assert.exists(responseBody.error)
    assert.include(responseBody.error.message.toLowerCase(), 'stock')
  })

  test('POST /compras should handle GitHub API failures gracefully', async ({ client, assert }) => {
    const item = await ItemFactory.merge({
      qtd_atual: 3
    }).create()

    // Mock GitHub API failure
    const apiError = new Error('GitHub API unavailable')
    apiError.response = { status: 503 }
    axiosStub.rejects(apiError)

    const response = await client.post('/compras').json({
      item_id: item.id
    })

    response.assertStatus(503)
    
    const responseBody = response.body()
    assert.exists(responseBody.error)
    assert.include(responseBody.error.message.toLowerCase(), 'github')

    // Verify item quantity was not decremented due to failure
    await item.refresh()
    assert.equal(item.qtdAtual, 3)
  })

  test('POST /compras should handle concurrent purchases correctly', async ({ client, assert }) => {
    const item = await ItemFactory.merge({
      nome: 'Concurrent Test Item',
      preco: 10.00,
      qtd_atual: 2 // Only 2 items available
    }).create()

    // Mock different GitHub users for each request
    const mockUsers = [
      { login: 'user1', id: 1 },
      { login: 'user2', id: 2 },
      { login: 'user3', id: 3 }
    ]

    let callCount = 0
    axiosStub.callsFake(() => {
      const user = mockUsers[callCount % mockUsers.length]
      callCount++
      return Promise.resolve({
        data: [{ ...user, type: 'User', site_admin: false }],
        status: 200
      })
    })

    // Try to make 3 concurrent purchases (should only succeed for 2)
    const promises = [
      client.post('/compras').json({ item_id: item.id }),
      client.post('/compras').json({ item_id: item.id }),
      client.post('/compras').json({ item_id: item.id })
    ]

    const responses = await Promise.allSettled(promises)

    // Count successful and failed responses
    const successful = responses.filter(r => r.status === 'fulfilled' && r.value.response.status === 201)
    const failed = responses.filter(r => 
      r.status === 'fulfilled' && r.value.response.status === 422 ||
      r.status === 'rejected'
    )

    assert.equal(successful.length, 2)
    assert.equal(failed.length, 1)

    // Verify final stock is 0
    await item.refresh()
    assert.equal(item.qtdAtual, 0)
  })

  test('GET /compras should return empty array when no purchases exist', async ({ client, assert }) => {
    const response = await client.get('/compras')

    response.assertStatus(200)
    response.assertBody([])
  })

  test('GET /compras should return all purchases with item data', async ({ client, assert }) => {
    // Create items
    const item1 = await ItemFactory.merge({
      nome: 'Item One',
      preco: 19.99,
      qtd_atual: 5
    }).create()

    const item2 = await ItemFactory.merge({
      nome: 'Item Two',
      preco: 29.99,
      qtd_atual: 3
    }).create()

    // Create purchases
    const compra1 = await CompraFactory.merge({
      compradorGithubLogin: 'buyer1',
      itemId: item1.id
    }).create()

    const compra2 = await CompraFactory.merge({
      compradorGithubLogin: 'buyer2',
      itemId: item2.id
    }).create()

    const compra3 = await CompraFactory.merge({
      compradorGithubLogin: 'buyer3',
      itemId: item1.id
    }).create()

    const response = await client.get('/compras')

    response.assertStatus(200)
    
    const responseBody = response.body()
    assert.isArray(responseBody)
    assert.equal(responseBody.length, 3)

    // Verify each purchase has the expected structure with item data
    responseBody.forEach(compra => {
      assert.exists(compra.id)
      assert.exists(compra.comprador_github_login)
      assert.exists(compra.item_id)
      assert.exists(compra.created_at)
      assert.exists(compra.updated_at)

      // Should include complete item information
      assert.exists(compra.item)
      assert.exists(compra.item.id)
      assert.exists(compra.item.nome)
      assert.exists(compra.item.preco)
      assert.exists(compra.item.qtd_atual)
    })

    // Verify specific data
    const compraIds = responseBody.map(c => c.id).sort()
    const expectedIds = [compra1.id, compra2.id, compra3.id].sort()
    assert.deepEqual(compraIds, expectedIds)

    // Verify item relationships
    const item1Compras = responseBody.filter(c => c.item_id === item1.id)
    const item2Compras = responseBody.filter(c => c.item_id === item2.id)
    
    assert.equal(item1Compras.length, 2)
    assert.equal(item2Compras.length, 1)

    item1Compras.forEach(compra => {
      assert.equal(compra.item.nome, 'Item One')
      assert.equal(compra.item.preco, 19.99)
    })

    item2Compras.forEach(compra => {
      assert.equal(compra.item.nome, 'Item Two')
      assert.equal(compra.item.preco, 29.99)
    })
  })

  test('GET /compras should return purchases in consistent format', async ({ client, assert }) => {
    const item = await ItemFactory.merge({
      nome: 'Format Test Item',
      preco: 42.50,
      qtd_atual: 1
    }).create()

    await CompraFactory.merge({
      compradorGithubLogin: 'format-test-user',
      itemId: item.id
    }).create()

    const response = await client.get('/compras')

    response.assertStatus(200)
    
    const responseBody = response.body()
    assert.equal(responseBody.length, 1)

    const compra = responseBody[0]
    assert.isNumber(compra.id)
    assert.equal(compra.comprador_github_login, 'format-test-user')
    assert.equal(compra.item_id, item.id)
    assert.isString(compra.created_at)
    assert.isString(compra.updated_at)

    // Verify item data format
    assert.isNumber(compra.item.id)
    assert.equal(compra.item.nome, 'Format Test Item')
    assert.equal(compra.item.preco, 42.50)
    assert.isNumber(compra.item.qtd_atual)
  })

  test('GET /compras should handle large number of purchases', async ({ client, assert }) => {
    // Create an item
    const item = await ItemFactory.create()

    // Create many purchases
    await CompraFactory.merge({ itemId: item.id }).createMany(50)

    const response = await client.get('/compras')

    response.assertStatus(200)
    
    const responseBody = response.body()
    assert.equal(responseBody.length, 50)

    // Verify all have item data loaded
    responseBody.forEach(compra => {
      assert.exists(compra.item)
      assert.equal(compra.item.id, item.id)
    })
  })

  test('POST /compras should handle GitHub API retry scenarios', async ({ client, assert }) => {
    const item = await ItemFactory.merge({
      qtd_atual: 1
    }).create()

    const mockUser: GitHubUser = {
      login: 'retryuser',
      id: 99999,
      node_id: 'MDQ6VXNlcjk5OTk5',
      avatar_url: 'https://avatars.githubusercontent.com/u/99999?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/retryuser',
      html_url: 'https://github.com/retryuser',
      followers_url: 'https://api.github.com/users/retryuser/followers',
      following_url: 'https://api.github.com/users/retryuser/following{/other_user}',
      gists_url: 'https://api.github.com/users/retryuser/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/retryuser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/retryuser/subscriptions',
      organizations_url: 'https://api.github.com/users/retryuser/orgs',
      repos_url: 'https://api.github.com/users/retryuser/repos',
      events_url: 'https://api.github.com/users/retryuser/events{/privacy}',
      received_events_url: 'https://api.github.com/users/retryuser/received_events',
      type: 'User',
      site_admin: false
    }

    // First call fails, second succeeds
    const serverError = new Error('Request failed with status code 502')
    serverError.response = { status: 502 }
    
    axiosStub.onFirstCall().rejects(serverError)
    axiosStub.onSecondCall().resolves({
      data: [mockUser],
      status: 200
    })

    const response = await client.post('/compras').json({
      item_id: item.id
    })

    response.assertStatus(201)
    response.assertBodyContains({
      comprador_github_login: 'retryuser'
    })

    // Verify GitHub API was called twice (retry worked)
    assert.equal(axiosStub.callCount, 2)
  })

  test('Compras endpoints should maintain data consistency', async ({ client, assert }) => {
    // Create item with specific quantity
    const item = await ItemFactory.merge({
      nome: 'Consistency Test',
      preco: 33.33,
      qtd_atual: 3
    }).create()

    // Mock GitHub users
    const mockUsers = ['user1', 'user2', 'user3'].map((login, index) => ({
      login,
      id: index + 1,
      type: 'User',
      site_admin: false
    }))

    let userIndex = 0
    axiosStub.callsFake(() => {
      const user = mockUsers[userIndex % mockUsers.length]
      userIndex++
      return Promise.resolve({
        data: [user],
        status: 200
      })
    })

    // Make 3 purchases
    for (let i = 0; i < 3; i++) {
      const response = await client.post('/compras').json({
        item_id: item.id
      })
      response.assertStatus(201)
    }

    // Verify final state
    await item.refresh()
    assert.equal(item.qtdAtual, 0)

    // Verify all purchases are recorded
    const comprasResponse = await client.get('/compras')
    comprasResponse.assertStatus(200)
    
    const compras = comprasResponse.body()
    assert.equal(compras.length, 3)

    // All should reference the same item
    compras.forEach(compra => {
      assert.equal(compra.item_id, item.id)
      assert.equal(compra.item.nome, 'Consistency Test')
      assert.equal(compra.item.preco, 33.33)
    })

    // Should have different buyers
    const buyers = compras.map(c => c.comprador_github_login).sort()
    assert.deepEqual(buyers, ['user1', 'user2', 'user3'])
  })
})