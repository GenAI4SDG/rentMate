export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  databaseUrl: process.env.DATABASE_URL ?? "",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
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
        "Add to backend/server/.env.local OR reuse Figma/.env.local:",
        "  VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (minimum for map reads)",
        "Optional: SUPABASE_SERVICE_ROLE_KEY for seed / create listing",
        "Optional: DATABASE_URL for direct Postgres (geocode DB cache)",
      ].join("\n"),
    )
  }
}
