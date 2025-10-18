import { DataSource } from 'typeorm';
import { DatabaseSeeder } from './seed';
import { AppModule } from '../../app.module';

/**
 * Script to run database seeding
 * Usage: npm run seed
 */
async function runSeed() {
  console.log('🚀 Starting database seeding process...');

  // Create a new DataSource instance
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: process.env.DB_NAME || 'erp_backend',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  try {
    // Initialize the database connection
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Run the seeder
    const seeder = new DatabaseSeeder(dataSource);
    await seeder.seed();

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding process
runSeed();
