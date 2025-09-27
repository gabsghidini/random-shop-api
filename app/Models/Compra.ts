import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Item from './Item'

export default class Compra extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public compradorGithubLogin: string

  @column()
  public itemId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Item)
  public item: BelongsTo<typeof Item>
}