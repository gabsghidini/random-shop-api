import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  /*
   * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
   *
   * For example:
   * 1. The username must be of data type string. But then also, it should
   *    not contain special characters or numbers.
   *    ```
   *     schema.string({}, [ rules.alpha() ])
   *    ```
   *
   * 2. The email must be of data type string, formatted as a valid
   *    email. But also, not used by any other user.
   *    ```
   *     schema.string({}, [
   *       rules.email(),
   *       rules.unique({ table: 'users', column: 'email' }),
   *     ])
   *    ```
   */
  public schema = schema.create({
    nome: schema.string({}, [
      rules.minLength(1),
      rules.maxLength(255)
    ]),
    preco: schema.number([
      rules.range(0.01, 999999.99)
    ]),
    qtdAtual: schema.number([
      rules.range(0, 999999)
    ])
  })

  /**
   * Custom messages for validation failures. You can make use of dot notation `(.)`
   * for targeting nested fields and array expressions `(*)` for targeting all
   * members of an array.
   */
  public messages: CustomMessages = {
    'nome.required': 'O nome do item é obrigatório',
    'nome.string': 'O nome deve ser um texto válido',
    'nome.minLength': 'O nome deve ter pelo menos 1 caractere',
    'nome.maxLength': 'O nome não pode ter mais de 255 caracteres',
    
    'preco.required': 'O preço é obrigatório',
    'preco.number': 'O preço deve ser um número válido',
    'preco.range': 'O preço deve ser maior que 0 e menor que 999999.99',
    
    'qtdAtual.required': 'A quantidade atual é obrigatória',
    'qtdAtual.number': 'A quantidade atual deve ser um número inteiro',
    'qtdAtual.range': 'A quantidade atual deve ser um número não negativo'
  }
}