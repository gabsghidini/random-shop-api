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
| new InsufficientStockException('message', 422, 'E_INSUFFICIENT_STOCK')
|
*/
export default class InsufficientStockException extends Exception {
  constructor(itemId: number, itemName: string) {
    super(`Item "${itemName}" (ID: ${itemId}) is out of stock`, 422, 'E_INSUFFICIENT_STOCK')
  }
}