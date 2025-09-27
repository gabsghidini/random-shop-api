import Factory from '@ioc:Adonis/Lucid/Factory'
import Item from 'App/Models/Item'
import Compra from 'App/Models/Compra'

export const ItemFactory = Factory.define(Item, ({ faker }) => {
  return {
    nome: faker.commerce.productName(),
    preco: parseFloat(faker.commerce.price({ min: 1, max: 1000, dec: 2 })),
    qtdAtual: faker.number.int({ min: 0, max: 100 })
  }
}).build()

export const CompraFactory = Factory.define(Compra, ({ faker }) => {
  return {
    compradorGithubLogin: faker.internet.userName().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    itemId: 1 // This should be overridden when creating compras
  }
}).build()