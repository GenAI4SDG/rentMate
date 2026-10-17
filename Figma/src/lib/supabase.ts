import { createClient, SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null
  return createClient(url, anonKey)
}

export type AmenityRow = {
  id: string
  name_en: string
  name_zh: string
}
