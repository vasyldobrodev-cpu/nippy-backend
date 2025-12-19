import { initializeDatabase, checkPostgreSQLConnection } from '../utils/initializeDb';

/**
 * Standalone script to set up the database
 * Run with: npx ts-node src/scripts/setupDatabase.ts
 */
const setupDatabase = async (): Promise<void> => {
  console.log('🚀 Starting database setup...\n');
  
  try {
    // Step 1: Check PostgreSQL server connection
    await checkPostgreSQLConnection();
    
    console.log('\n' + '='.repeat(50));
    
    // Step 2: Initialize database
    await initializeDatabase();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎊 Database setup completed successfully!');
    console.log('🔄 You can now start your application');
    
  } catch (error) {
    console.error('\n💥 Database setup failed!');
    console.error('Error details:', error);
    process.exit(1);
  }
};

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };