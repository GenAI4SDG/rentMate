import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"

const here = dirname(fileURLToPath(import.meta.url))

const envPaths = [
  join(here, "../.env.local"),
  join(here, "../../.env.local"),
  join(here, "../../../Figma/.env.local"),
  join(here, "../.env"),
  join(here, "../../.env"),
]

for (const path of envPaths) {
  if (existsSync(path)) {
    dotenv.config({ path, override: false })
  }
}

if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
  process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL
}
if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
}
