import { databaseConfig } from '@gaoge/server-database';
import { AppModule } from './app.module';

export function bootstrap() {
  return {
    module: new AppModule(),
    database: databaseConfig,
  };
}

console.log('apps/api bootstrap scaffold ready', bootstrap());
