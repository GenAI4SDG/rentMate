import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { config } from "./config.js"

let client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client
  const key =
    config.supabaseServiceRoleKey ||
    config.supabaseAnonKey ||
    ""
  if (!config.supabaseUrl || !key) {
    throw new Error("Supabase URL and anon or service_role key required")
  }
  client = createClient(config.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

export function hasDirectDatabase(): boolean {
  return Boolean(config.databaseUrl)
}
