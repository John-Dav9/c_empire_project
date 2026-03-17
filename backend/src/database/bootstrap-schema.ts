import { DataSource } from 'typeorm';
import appDataSource from './data-source';

async function bootstrapSchema() {
  const syncDataSource = new DataSource({
    ...appDataSource.options,
    migrations: [],
    synchronize: true,
  });

  await syncDataSource.initialize();
  await syncDataSource.destroy();
  console.log('Database schema synchronized successfully.');
}

void bootstrapSchema();
