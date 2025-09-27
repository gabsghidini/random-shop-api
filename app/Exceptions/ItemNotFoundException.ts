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
| new ItemNotFoundException('message', 500, 'E_RUNTIME_EXCEPTION')
|
*/
export default class ItemNotFoundException extends Exception {
  constructor(itemId: number) {
    super(`Item with ID ${itemId} not found`, 404, 'E_ITEM_NOT_FOUND')
  }
}