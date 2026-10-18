import pg from "pg"
import { config } from "./config.js"

let pool: pg.Pool | null = null

export function getPool(): pg.Pool {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is not set (optional if Supabase keys are configured)")
  }
  if (!pool) {
    pool = new pg.Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes("supabase")
        ? { rejectUnauthorized: false }
        : undefined,
      max: 5,
    })
  }
  return pool
}
