import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const config = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 8000,
  keepAlive: true,
});

config.on("error", (err) => {
  if (
    err.message.includes("DbHandler") ||
    err.message.includes("idle")
  ) {
    return;
  }
  console.error("pool error", err.message);
});

(async () => {
  try {
    const now = await config.query("SELECT NOW()");
    console.log("connected to Supabase PostgreSQL at", now.rows[0].now);
  } catch (err: any) {
    console.error("failed to connect to Supabase PostgreSQL", err.message);
  }
})();

const shutdownPool = async () => {
  console.log("shutting down database pool...");
  try {
    await config.end();
    console.log("postgreSQL pool closed cleanly");
    process.exit(0);
  } catch (err: any) {
    console.error("error during pool shutdown", err.message);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdownPool);
process.on("SIGINT", shutdownPool);