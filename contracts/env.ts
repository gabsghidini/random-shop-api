declare module '@ioc:Adonis/Core/Env' {
  interface EnvTypes {
    PORT: number;
    HOST: string;
    NODE_ENV: 'development' | 'production' | 'testing';
    APP_KEY: string;
    DRIVE_DISK: string;
    DB_CONNECTION: string;
    DB_DATABASE: string;
  }
}