import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("database URL not set");
}

const isSupabase = connectionString.includes("supabase.co");

export const config = new Pool({
  connectionString,
  ssl: isSupabase
    ? { rejectUnauthorized: false }
    : false, 
});

config.query("SELECT NOW()")
.then(() => {
  console.log(
    `connected to Postgre (${isSupabase ? "supabase" : "local"})`
  );
})
.catch((err) => {
  console.error("database connection error cause ", err.message);
});