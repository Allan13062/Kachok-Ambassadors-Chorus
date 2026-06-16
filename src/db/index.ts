import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pg;

export const createPool = () => {
  const host = process.env.SQL_HOST;
  const user = process.env.SQL_USER;
  const password = process.env.SQL_PASSWORD;
  const database = process.env.SQL_DB_NAME;

  if (!host || !user || !password || !database) {
    console.warn("[Cloud SQL Client] Connection environment variables are missing! Database calls might fail.");
  }

  // Serverless Postgres engines (Neon, Supabase) require SSL connections
  const isServerless = host?.includes("neon.tech") || host?.includes("supabase.co") || host?.includes("supa");

  return new Pool({
    host,
    user,
    password,
    database,
    connectionTimeoutMillis: 15000,
    ssl: isServerless ? { rejectUnauthorized: false } : undefined,
  });
};

const pool = createPool();

pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});

export const db = drizzle(pool, { schema });
export { pool };
