import { executeMigrations } from "./migrations";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

async function run() {
  try {
    await executeMigrations();
    logger.info("Migration successful");
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
