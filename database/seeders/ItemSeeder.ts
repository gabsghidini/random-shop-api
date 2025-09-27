import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import { ItemFactory } from 'Database/factories'

export default class extends BaseSeeder {
  public static environment = ['development', 'testing']
  public async run() {
    // Create some predefined sample items for consistent testing
    const sampleItems = [
      {
        nome: 'Smartphone Samsung Galaxy S23',
        preco: 899.99,
        qtdAtual: 15
      },
      {
        nome: 'Notebook Dell Inspiron 15',
        preco: 1299.99,
        qtdAtual: 8
      },
      {
        nome: 'Fone de Ouvido Sony WH-1000XM4',
        preco: 349.99,
        qtdAtual: 25
      },
      {
        nome: 'Tablet Apple iPad Air',
        preco: 599.99,
        qtdAtual: 12
      },
      {
        nome: 'Smart TV LG 55" 4K',
        preco: 799.99,
        qtdAtual: 6
      },
      {
        nome: 'Console PlayStation 5',
        preco: 499.99,
        qtdAtual: 3
      },
      {
        nome: 'Câmera Canon EOS R6',
        preco: 2499.99,
        qtdAtual: 4
      },
      {
        nome: 'Smartwatch Apple Watch Series 8',
        preco: 399.99,
        qtdAtual: 20
      },
      {
        nome: 'Teclado Mecânico Logitech MX',
        preco: 149.99,
        qtdAtual: 30
      },
      {
        nome: 'Mouse Gamer Razer DeathAdder',
        preco: 79.99,
        qtdAtual: 45
      },
      {
        nome: 'Monitor 27" 4K Dell UltraSharp',
        preco: 549.99,
        qtdAtual: 10
      },
      {
        nome: 'SSD Samsung 1TB NVMe',
        preco: 129.99,
        qtdAtual: 50
      },
      {
        nome: 'Placa de Vídeo RTX 4070',
        preco: 599.99,
        qtdAtual: 7
      },
      {
        nome: 'Processador AMD Ryzen 7',
        preco: 329.99,
        qtdAtual: 18
      },
      {
        nome: 'Memória RAM 32GB DDR4',
        preco: 199.99,
        qtdAtual: 25
      }
    ]

    // Insert the predefined sample items
    const { default: Item } = await import('App/Models/Item')
    await Item.createMany(sampleItems)

    // Create additional random items using the factory for variety
    await ItemFactory.createMany(10)
  }
}