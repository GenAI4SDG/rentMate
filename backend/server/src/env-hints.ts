import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))

/** Paths checked by load-env.ts (for error messages). */
export const ENV_FILE_CANDIDATES = [
  join(here, "../.env.local"),
  join(here, "../../.env.local"),
  join(here, "../../../Figma/.env.local"),
  join(here, "../.env"),
] as const

export function describeEnvSetup(forSeed: boolean): string {
  const found = ENV_FILE_CANDIDATES.filter((p) => existsSync(p))
  const lines = [
    forSeed
      ? "Seed needs Supabase URL + service_role key (never put service_role in Figma/.env.local)."
      : "Map API needs Supabase URL + anon or service_role key.",
    "",
    "1. Copy the template:",
    "   cp backend/server/.env.example backend/server/.env.local (see docs/demo-user-guide.md)",
    "",
    "2. In Supabase → Project Settings → API, paste:",
    "   SUPABASE_URL          = Project URL",
    "   SUPABASE_ANON_KEY     = anon public",
    forSeed
      ? "   SUPABASE_SERVICE_ROLE_KEY = legacy service_role eyJ… OR sb_secret_… (never sb_publishable_)"
      : "   Optional: SUPABASE_SERVICE_ROLE_KEY for seed + landlord listing POST",
    "",
    "3. Run seed from the map API folder (not backend/backend/server):",
    "   cd backend/server && npm run seed:listings",
    "   — or from repo root: npm run map-api:seed --prefix backend",
    "",
  ]
  if (found.length) {
    lines.push("Env files found on disk:")
    for (const p of found) lines.push(`  • ${p}`)
    lines.push("")
    if (forSeed && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      lines.push(
        "SUPABASE_SERVICE_ROLE_KEY is missing. Figma/.env.local only supplies VITE_* — add service_role to backend/server/.env.local.",
      )
    }
    if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
      lines.push("SUPABASE_URL is missing in those files.")
    }
  } else {
    lines.push("No .env.local found yet — create backend/server/.env.local (see steps above).")
  }
  return lines.join("\n")
}
