import { DataSource } from "typeorm";
import { initializeDatabase } from "../utils/initializeDb";
console.log(
  process.env.DB_HOST,
  process.env.DB_PORT,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  process.env.DB_NAME
);
export const AppDataSource = new DataSource({
  type: "postgres",
  // url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_fekO5B9UJvWP@ep-dawn-king-aeupt9vt-pooler.c-2.us-east-2.aws.neon.tech/nippy?sslmode=require&channel_binding=require",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: process.env.NODE_ENV === "development",
  //logging: process.env.NODE_ENV === 'development',

  entities: ["src/entities/*.ts"],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
  ...(process.env.USE_LOCAL_DB === "true"
    ? {}
    : {
        ssl: { rejectUnauthorized: false },
        extra: { sslmode: "require" },
      }),
});

/**
 * Initialize database connection with automatic database creation
 */
export const initializeDatabaseConnection = async (): Promise<void> => {
  try {
    console.log("🔄 Initializing database connection...");

    // Step 1: Ensure database exists
    await initializeDatabase();

    // Step 2: Initialize TypeORM data source
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ TypeORM data source initialized successfully");
    }

    console.log("🎉 Database connection established!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
};
