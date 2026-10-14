// Supabase client.
//
// The demo runs with OR WITHOUT a configured project:
//   - configured   -> Auth (email OTP) + Postgres + the `compatibility` Edge Function
//   - not configured -> everything falls back to local, in-browser behaviour
//     (see lib/api.ts), so `npm run dev` always shows a working demo.
//
// Only the ANON key belongs here. It is public by design (RLS protects the data).
// The service-role key and the OpenAI key live only in Edge Function secrets.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export const backendMode: "supabase" | "local" = isSupabaseConfigured ? "supabase" : "local";
