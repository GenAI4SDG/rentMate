export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  databaseUrl: process.env.DATABASE_URL ?? "",
  supabaseUrl:
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey:
    process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  osmApiBaseUrl: process.env.OSM_API_BASE_URL ?? "http://localhost:3000",
  nominatimUrl: process.env.NOMINATIM_URL ?? "https://nominatim.openstreetmap.org",
  overpassUrl:
    process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter",
  osmUserAgent:
    process.env.OSM_USER_AGENT ??
    "RentMate/1.0 (hackathon; contact@rentmate.local)",
  listingsMaxResults: 500,
  defaultMapCenter: { lat: 22.3193, lng: 114.1694 },
}

export function assertServerConfig(): void {
  const hasSupabase =
    config.supabaseUrl &&
    (config.supabaseAnonKey || config.supabaseServiceRoleKey)
  const hasPg = Boolean(config.databaseUrl)

  if (!hasSupabase && !hasPg) {
    throw new Error(
      [
        "Missing Supabase credentials for the map API.",
        "",
        "Local: backend/server/.env.local with SUPABASE_URL + SUPABASE_ANON_KEY",
        "(or VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from Figma/.env.local).",
        "",
        "Render / Railway / Fly: Dashboard → your web service → Environment → add:",
        "  SUPABASE_URL=https://YOUR_REF.supabase.co",
        "  SUPABASE_ANON_KEY=eyJ... (anon public key)",
        "  SUPABASE_SERVICE_ROLE_KEY=... (required for landlord sign-in & listing writes)",
        "  OSM_USER_AGENT=RentMate/1.0 (you@email.com)",
        "",
        "Save env vars, then Manual Deploy (or wait for auto redeploy).",
        "Optional: DATABASE_URL for direct Postgres geocode cache.",
      ].join("\n"),
    )
  }
}
