import { pool } from "../config/database";
import { logger } from "../utils/logger";
import fs from "fs";
import path from "path";

async function createMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(query);
    logger.info("Migrations table created or already exists");
  } catch (error) {
    logger.error("Error creating migrations table:", error);
    throw error;
  }
}

async function executeMigrations() {
  await createMigrationsTable();

  const migrationsDir = path.join(__dirname, "../migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const migrationName = path.basename(file);

    const checkQuery = "SELECT id FROM migrations WHERE name = $1";
    const result = await pool.query(checkQuery, [migrationName]);

    if (result.rows.length === 0) {
      const sql = fs.readFileSync(filePath, "utf-8");
      try {
        await pool.query("BEGIN");
        await pool.query(sql);
        await pool.query("INSERT INTO migrations (name) VALUES ($1)", [
          migrationName,
        ]);
        await pool.query("COMMIT");
        logger.info(`Executed migration: ${migrationName}`);
      } catch (error) {
        await pool.query("ROLLBACK");
        logger.error(`Error executing migration ${migrationName}:`, error);
        throw error;
      }
    }
  }
}

export { executeMigrations };
