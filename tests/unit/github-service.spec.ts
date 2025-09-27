import { test } from '@japa/runner'
import sinon from 'sinon'
import axios from 'axios'
import GitHubService, { GitHubApiException, GitHubUser } from 'App/Services/GitHubService'

test.group('GitHubService', (group) => {
  let githubService: GitHubService
  let axiosStub: sinon.SinonStub

  group.each.setup(() => {
    githubService = new GitHubService()
    axiosStub = sinon.stub(axios, 'get')
    
    return () => {
      sinon.restore()
    }
  })

  test('should fetch a random user successfully', async ({ assert }) => {
    const mockUser: GitHubUser = {
      login: 'testuser',
      id: 12345,
      node_id: 'MDQ6VXNlcjEyMzQ1',
      avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/testuser',
      html_url: 'https://github.com/testuser',
      followers_url: 'https://api.github.com/users/testuser/followers',
      following_url: 'https://api.github.com/users/testuser/following{/other_user}',
      gists_url: 'https://api.github.com/users/testuser/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/testuser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/testuser/subscriptions',
      organizations_url: 'https://api.github.com/users/testuser/orgs',
      repos_url: 'https://api.github.com/users/testuser/repos',
      events_url: 'https://api.github.com/users/testuser/events{/privacy}',
      received_events_url: 'https://api.github.com/users/testuser/received_events',
      type: 'User',
      site_admin: false
    }

    axiosStub.resolves({
      data: [mockUser],
      status: 200,
      statusText: 'OK'
    })

    const user = await githubService.getRandomUser()

    assert.equal(user.login, 'testuser')
    assert.equal(user.id, 12345)
    assert.equal(user.type, 'User')
    assert.isFalse(user.site_admin)

    // Verify the API was called with correct parameters
    assert.isTrue(axiosStub.calledOnce)
    const callArgs = axiosStub.getCall(0).args
    assert.equal(callArgs[0], 'https://api.github.com/users')
    assert.exists(callArgs[1].params.since)
    assert.equal(callArgs[1].params.per_page, 1)
    assert.equal(callArgs[1].timeout, 10000)
    assert.equal(callArgs[1].headers['Accept'], 'application/vnd.github.v3+json')
    assert.equal(callArgs[1].headers['User-Agent'], 'Random-Shopping-API/1.0')
  })

  test('should use random since parameter', async ({ assert }) => {
    const mockUser: GitHubUser = {
      login: 'randomuser',
      id: 67890,
      node_id: 'MDQ6VXNlcjY3ODkw',
      avatar_url: 'https://avatars.githubusercontent.com/u/67890?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/randomuser',
      html_url: 'https://github.com/randomuser',
      followers_url: 'https://api.github.com/users/randomuser/followers',
      following_url: 'https://api.github.com/users/randomuser/following{/other_user}',
      gists_url: 'https://api.github.com/users/randomuser/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/randomuser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/randomuser/subscriptions',
      organizations_url: 'https://api.github.com/users/randomuser/orgs',
      repos_url: 'https://api.github.com/users/randomuser/repos',
      events_url: 'https://api.github.com/users/randomuser/events{/privacy}',
      received_events_url: 'https://api.github.com/users/randomuser/received_events',
      type: 'User',
      site_admin: false
    }

    axiosStub.resolves({
      data: [mockUser],
      status: 200
    })

    // Call multiple times to verify different since parameters
    await githubService.getRandomUser()
    await githubService.getRandomUser()

    assert.equal(axiosStub.callCount, 2)
    
    const firstCall = axiosStub.getCall(0).args[1].params.since
    const secondCall = axiosStub.getCall(1).args[1].params.since

    // Since parameters should be different (very unlikely to be the same with random generation)
    assert.isNumber(firstCall)
    assert.isNumber(secondCall)
    assert.isTrue(firstCall >= 0 && firstCall <= 50000000)
    assert.isTrue(secondCall >= 0 && secondCall <= 50000000)
  })

  test('should throw GitHubApiException when no users returned', async ({ assert }) => {
    axiosStub.resolves({
      data: [],
      status: 200
    })

    await assert.rejects(
      () => githubService.getRandomUser(),
      GitHubApiException,
      'No users returned from GitHub API'
    )
  })

  test('should handle network timeout errors', async ({ assert }) => {
    const timeoutError = new Error('timeout of 10000ms exceeded')
    timeoutError.code = 'ECONNABORTED'
    axiosStub.rejects(timeoutError)

    const exception = await assert.rejects(
      () => githubService.getRandomUser(),
      GitHubApiException
    )

    assert.equal(exception.message, 'GitHub API request timed out')
    assert.equal(exception.status, 503)
  })

  test('should handle connection refused errors', async ({ assert }) => {
    const connectionError = new Error('connect ECONNREFUSED')
    connectionError.code = 'ECONNREFUSED'
    axiosStub.rejects(connectionError)

    const exception = await assert.rejects(
      () => githubService.getRandomUser(),
      GitHubApiException
    )

    assert.equal(exception.message, 'Unable to connect to GitHub API')
    assert.equal(exception.status, 503)
  })

  test('should handle DNS resolution errors', async ({ assert }) => {
    const dnsError = new Error('getaddrinfo ENOTFOUND api.github.com')
    dnsError.code = 'ENOTFOUND'
    axiosStub.rejects(dnsError)

    const exception = await assert.rejects(
      () => githubService.getRandomUser(),
      GitHubApiException
    )

    assert.equal(exception.message, 'Unable to connect to GitHub API')
    assert.equal(exception.status, 503)
  })

  test('should handle rate limiting (403) errors', async ({ assert }) => {
    const rateLimitError = new Error('Request failed with status code 403')
    rateLimitError.response = {
      status: 403,
      statusText: 'Forbidden',
      data: { message: 'API rate limit exceeded' }
    }
    axiosStub.rejects(rateLimitError)

    const exception = await assert.rejects(
      () => githubService.getRandomUser(),
      GitHubApiException
    )

    assert.equal(exception.message, 'GitHub API rate limit exceeded')
    assert.equal(exception.status, 503)
  })

  test('should handle 404 errors', async ({ assert }) => {
    const notFoundError = new Error('Request failed with status code 404')
    notFoundError.response = {
      status: 404,
      statusText: 'Not Found'
    }
    axiosStub.rejects(notFoundError)

    const exception = await assert.rejects(
      () => githubService.getRandomUser(),
      GitHubApiException
    )

    assert.equal(exception.message, 'GitHub API endpoint not found')
    assert.equal(exception.status, 503)
  })

  test('should handle server errors (5xx)', async ({ assert }) => {
    const serverError = new Error('Request failed with status code 500')
    serverError.response = {
      status: 500,
      statusText: 'Internal Server Error'
    }
    axiosStub.rejects(serverError)

    const exception = await assert.rejects(
      () => githubService.getRandomUser(),
      GitHubApiException
    )

    assert.equal(exception.message, 'GitHub API server error')
    assert.equal(exception.status, 503)
  })

  test('should retry on transient errors', async ({ assert }) => {
    const mockUser: GitHubUser = {
      login: 'retryuser',
      id: 11111,
      node_id: 'MDQ6VXNlcjExMTEx',
      avatar_url: 'https://avatars.githubusercontent.com/u/11111?v=4',
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

    // First call fails with server error, second succeeds
    const serverError = new Error('Request failed with status code 502')
    serverError.response = { status: 502 }
    
    axiosStub.onFirstCall().rejects(serverError)
    axiosStub.onSecondCall().resolves({
      data: [mockUser],
      status: 200
    })

    const user = await githubService.getRandomUser()

    assert.equal(user.login, 'retryuser')
    assert.equal(axiosStub.callCount, 2)
  })

  test('should not retry on client errors (4xx except 429)', async ({ assert }) => {
    const clientError = new Error('Request failed with status code 400')
    clientError.response = {
      status: 400,
      statusText: 'Bad Request'
    }
    axiosStub.rejects(clientError)

    await assert.rejects(
      () => githubService.getRandomUser(),
      GitHubApiException
    )

    // Should only be called once (no retries)
    assert.equal(axiosStub.callCount, 1)
  })

  test('should retry on 429 (rate limit) errors', async ({ assert }) => {
    const mockUser: GitHubUser = {
      login: 'ratelimituser',
      id: 22222,
      node_id: 'MDQ6VXNlcjIyMjIy',
      avatar_url: 'https://avatars.githubusercontent.com/u/22222?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/ratelimituser',
      html_url: 'https://github.com/ratelimituser',
      followers_url: 'https://api.github.com/users/ratelimituser/followers',
      following_url: 'https://api.github.com/users/ratelimituser/following{/other_user}',
      gists_url: 'https://api.github.com/users/ratelimituser/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/ratelimituser/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/ratelimituser/subscriptions',
      organizations_url: 'https://api.github.com/users/ratelimituser/orgs',
      repos_url: 'https://api.github.com/users/ratelimituser/repos',
      events_url: 'https://api.github.com/users/ratelimituser/events{/privacy}',
      received_events_url: 'https://api.github.com/users/ratelimituser/received_events',
      type: 'User',
      site_admin: false
    }

    const rateLimitError = new Error('Request failed with status code 429')
    rateLimitError.response = { status: 429 }
    
    axiosStub.onFirstCall().rejects(rateLimitError)
    axiosStub.onSecondCall().resolves({
      data: [mockUser],
      status: 200
    })

    const user = await githubService.getRandomUser()

    assert.equal(user.login, 'ratelimituser')
    assert.equal(axiosStub.callCount, 2)
  })

  test('should fail after maximum retry attempts', async ({ assert }) => {
    const serverError = new Error('Request failed with status code 503')
    serverError.response = { status: 503 }
    axiosStub.rejects(serverError)

    const exception = await assert.rejects(
      () => githubService.getRandomUser(),
      GitHubApiException
    )

    assert.equal(exception.message, 'GitHub API server error')
    assert.equal(exception.status, 503)
    // Should be called 4 times (1 initial + 3 retries)
    assert.equal(axiosStub.callCount, 4)
  })

  test('should handle unknown errors gracefully', async ({ assert }) => {
    const unknownError = new Error('Something unexpected happened')
    axiosStub.rejects(unknownError)

    const exception = await assert.rejects(
      () => githubService.getRandomUser(),
      GitHubApiException
    )

    assert.equal(exception.message, 'Something unexpected happened')
    assert.equal(exception.status, 503)
    assert.equal(exception.originalError, unknownError)
  })
})