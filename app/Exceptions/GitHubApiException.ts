import { Exception } from '@adonisjs/core/build/standalone'

/*
|--------------------------------------------------------------------------
| Exception
|--------------------------------------------------------------------------
|
| The Exception class imported from `@adonisjs/core` allows defining
| a status code and error code for every exception.
|
| @example
| new GitHubApiException('message', 503, 'E_GITHUB_API_ERROR')
|
*/
export default class GitHubApiException extends Exception {
  constructor(message: string = 'GitHub API is currently unavailable') {
    super(message, 503, 'E_GITHUB_API_ERROR')
  }
}