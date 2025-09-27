import axios from 'axios'

// Use a simple logger interface that can be mocked in tests
interface LoggerInterface {
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
}

// Simple console logger for fallback
const consoleLogger: LoggerInterface = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
  warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || '')
}

// Try to get AdonisJS logger, fallback to console
let Logger: LoggerInterface
try {
  Logger = require('@ioc:Adonis/Core/Logger').default
} catch {
  Logger = consoleLogger
}

export interface GitHubUser {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
}

export class GitHubApiException extends Error {
  public status: number
  public originalError: any

  constructor(message: string, status: number = 503, originalError?: any) {
    super(message)
    this.name = 'GitHubApiException'
    this.status = status
    this.originalError = originalError
  }
}

export default class GitHubService {
  private readonly baseUrl = 'https://api.github.com'
  private readonly timeout = 10000 // 10 seconds
  private readonly maxRetries = 3
  private readonly retryDelay = 1000 // 1 second

  /**
   * Fetches a random user from GitHub API
   * Uses the /users endpoint with a random since parameter to get different users
   */
  public async getRandomUser(): Promise<GitHubUser> {
    const maxAttempts = this.maxRetries + 1
    let lastError: any

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Generate a random since parameter to get different users
        // GitHub user IDs go up to millions, so we'll use a random number up to 50000000
        const randomSince = Math.floor(Math.random() * 50000000)
        
        const response = await axios.get<GitHubUser[]>(
          `${this.baseUrl}/users`,
          {
            params: {
              since: randomSince,
              per_page: 1
            },
            timeout: this.timeout,
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Random-Shopping-API/1.0'
            }
          }
        )

        if (!response.data || response.data.length === 0) {
          throw new Error('No users returned from GitHub API')
        }

        const user = response.data[0]
        return user

      } catch (error: any) {
        lastError = error

        // Don't retry on client errors (4xx) except for rate limiting (429)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          break
        }

        // If this isn't the last attempt, wait before retrying
        if (attempt < maxAttempts) {
          const delay = this.retryDelay * attempt // Exponential backoff
          await this.sleep(delay)
        }
      }
    }

    // All attempts failed, throw appropriate exception
    const errorMessage = this.getErrorMessage(lastError)
    const statusCode = this.getStatusCode(lastError)

    throw new GitHubApiException(errorMessage, statusCode, lastError)
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Extract meaningful error message from axios error
   */
  private getErrorMessage(error: any): string {
    if (error.code === 'ECONNABORTED') {
      return 'GitHub API request timed out'
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'Unable to connect to GitHub API'
    }

    if (error.response?.status === 403) {
      return 'GitHub API rate limit exceeded'
    }

    if (error.response?.status === 404) {
      return 'GitHub API endpoint not found'
    }

    if (error.response?.status >= 500) {
      return 'GitHub API server error'
    }

    return error.message || 'Unknown GitHub API error'
  }

  /**
   * Extract appropriate HTTP status code for our API response
   */
  private getStatusCode(error: any): number {
    // Map GitHub API errors to appropriate status codes for our API
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 503 // Service Unavailable
    }

    if (error.response?.status === 403) {
      return 503 // Service Unavailable (rate limited)
    }

    if (error.response?.status >= 500) {
      return 503 // Service Unavailable (GitHub server error)
    }

    return 503 // Default to Service Unavailable for external service issues
  }
}