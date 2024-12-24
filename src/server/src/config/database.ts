import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 20,
  waitForConnections: true,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

export async function initDB(): Promise<void> {
  try {
    // Test the connection
    await pool.query("SELECT 1");
    console.log("Database connection initialized successfully");
  } catch (error) {
    console.error("Error initializing database connection:", error);
    throw error;
  }
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const [rows] = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed query", {
      text,
      duration,
      rows: Array.isArray(rows) ? rows.length : 1,
    });
    return rows;
  } catch (error) {
    console.error("Error executing query:", error);
    throw error;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}

export { pool };
