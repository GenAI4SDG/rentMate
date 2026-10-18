/**
 * Geocode properties missing lat/lng (1 req/s). Run: npm run backfill:geocode
 */
import "../load-env.js"
import pg from "pg"
import { geocode } from "../geo/nominatim.js"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error("DATABASE_URL required")
  process.exit(1)
}

async function main() {
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const { rows } = await pool.query<{ id: string; address: string; district: string }>(
    `select id, address, district from public.properties
     where latitude is null or longitude is null`,
  )

  for (const row of rows) {
    const geo = await geocode(`${row.address}, ${row.district}, Hong Kong`)
    if (!geo) {
      await pool.query(
        `update public.properties set status = 'archived' where id = $1`,
        [row.id],
      )
      console.warn("Hidden (geocode failed):", row.id)
      continue
    }
    await pool.query(
      `update public.properties set latitude = $2, longitude = $3, status = 'active' where id = $1`,
      [row.id, geo.lat, geo.lng],
    )
    console.log("Geocoded", row.id)
  }

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
