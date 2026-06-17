import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pg;

export const createPool = () => {
  let host = process.env.SQL_HOST;
  const user = process.env.SQL_USER;
  const password = process.env.SQL_PASSWORD;
  const database = process.env.SQL_DB_NAME;

  if (!host || !user || !password || !database) {
    console.log("[Cloud SQL Client] Connection environment variables are missing! Database calls might fail.");
  }

  // Neon or other connection poolers in Transaction Mode do not support session-scoped prepared statements.
  // To avoid errors during INSERT or other query parameters with drizzle and node-postgres,
  // we automatically redirect to the direct non-pooled endpoint if -pooler is present in the host.
  if (host && host.includes("-pooler")) {
    console.log("[Cloud SQL Client] Auto-handling Neon pooler host. Swapping to non-pooled host for statement stability.");
    host = host.replace("-pooler", "");
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
  console.warn("Unexpected error on idle SQL pool client:", err.message);
});

export const db = drizzle(pool, { schema });
export { pool };
