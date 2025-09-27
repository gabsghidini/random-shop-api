import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'

export default class extends BaseSeeder {
  private async seed(Seeder: { default: typeof BaseSeeder }) {
    /**
     * Do not run when not in a environment specified in Seeder
     */
    if (
      (!Seeder.default.environment.includes('development') && this.app.inDev) ||
      (!Seeder.default.environment.includes('testing') && this.app.inTest)
    ) {
      return
    }

    await new Seeder.default(this.client).run()
  }

  public async run() {
    await this.seed(await import('../seeders/ItemSeeder'))
  }
}