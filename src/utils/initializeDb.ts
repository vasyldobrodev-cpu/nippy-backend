import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

const getDbConfig = (): DbConfig => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'aws_ecommerce_db',
});

/**
 * Check if database exists
 */
const checkDatabaseExists = async (config: DbConfig): Promise<boolean> => {
  // For Neon/cloud databases, we'll use the full connection URL
  const connectionUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_49ixkPtgWJur@ep-divine-poetry-adak6015-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  
  const client = new Client({
    connectionString: connectionUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database]
    );
    
    await client.end();
    return result.rows.length > 0;
  } catch (error) {
    await client.end();
    console.error('❌ Error checking database existence:', error);
    throw error;
  }
};

/**
 * Create database if it doesn't exist
 */
const createDatabase = async (config: DbConfig): Promise<void> => {
  // For Neon/cloud databases, we'll use the full connection URL  
  const connectionUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_fekO5B9UJvWP@ep-winter-frog-aehfo4cd-pooler.c-2.us-east-2.aws.neon.tech/nippy?sslmode=require&channel_binding=require";
  
  const client = new Client({
    connectionString: connectionUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    
    // Create database (database names cannot be parameterized, so we validate the name)
    const dbName = config.database.replace(/[^a-zA-Z0-9_]/g, ''); // Sanitize database name
    if (dbName !== config.database) {
      throw new Error(`Invalid database name: ${config.database}`);
    }
    
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Database '${config.database}' created successfully`);
    
    await client.end();
  } catch (error) {
    await client.end();
    console.error('❌ Error creating database:', error);
    throw error;
  }
};

/**
 * Test database connection
 */
const testConnection = async (config: DbConfig): Promise<void> => {
  // For Neon/cloud databases, we'll use the full connection URL
  const connectionUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_fekO5B9UJvWP@ep-winter-frog-aehfo4cd-pooler.c-2.us-east-2.aws.neon.tech/nippy?sslmode=require&channel_binding=require";
  
  const client = new Client({
    connectionString: connectionUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log(`✅ Successfully connected to database '${config.database}'`);
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`🕒 Database server time: ${result.rows[0].current_time}`);
    
    await client.end();
  } catch (error) {
    await client.end();
    console.error('❌ Error testing database connection:', error);
    throw error;
  }
};

/**
 * Initialize database - main function (simplified for Neon)
 */
export const initializeDatabase = async (): Promise<void> => {
  console.log('🔍 Initializing database connection...');
  
  // For Neon database, we just need to test the connection
  const connectionUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_fekO5B9UJvWP@ep-dawn-king-aeupt9vt-pooler.c-2.us-east-2.aws.neon.tech/nippy?sslmode=require&channel_binding=require";
  
  const client = new Client({
    connectionString: connectionUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('🧪 Testing database connection...');
    await client.connect();
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log(`✅ Successfully connected to Neon database`);
    console.log(`🕒 Database server time: ${result.rows[0].current_time}`);
    console.log(`📊 Database version: ${result.rows[0].db_version.split(' ')[0] + ' ' + result.rows[0].db_version.split(' ')[1]}`);
    
    await client.end();
    console.log('\n🎉 Database initialization completed successfully!');
    
  } catch (error) {
    await client.end();
    console.error('\n💥 Database initialization failed:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check your Neon database connection string');
    console.log('   2. Ensure SSL is properly configured');
    console.log('   3. Verify your Neon database is active');
    throw error;
  }
};

// Call the function during initialization
(async () => {
  const config = getDbConfig();
})();

/**
 * Check PostgreSQL server connection
 */
export const checkPostgreSQLConnection = async (): Promise<void> => {
  const config = getDbConfig();
  
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: 'postgres',
  });

  try {
    console.log('🔌 Checking PostgreSQL server connection...');
    await client.connect();
    
    const result = await client.query('SELECT version()');
    console.log(`✅ PostgreSQL server connected successfully`);
    console.log(`📊 Server version: ${result.rows[0].version}`);
    
    await client.end();
  } catch (error) {
    await client.end();
    console.error('❌ Failed to connect to PostgreSQL server:', error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Make sure PostgreSQL is running');
    console.log('   2. Check your database credentials in .env file');
    console.log('   3. Verify host and port are correct');
    console.log('   4. Ensure user has database creation privileges');
    throw error;
  }
};