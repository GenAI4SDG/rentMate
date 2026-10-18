// Supabase client.
//
// AUTH MODEL (2026-10-14): the account key is the user's EMAIL, checked
// client-side against the institution allowlist in lib/institutions.ts. There is
// NO Supabase Auth here — no sign-up, no password, no OTP, no session — so
// there is no auth.users and no auth.uid() to key a policy on. RLS is therefore
// DISABLED on every table in the migration (an enabled policy would block every
// row). That is a demo-only trade; see `vault/ips/IP.rentmate.v3.md` open
// question U7 before this schema is pointed at real students.
//
// The demo runs with OR WITHOUT a configured project:
//   - configured   -> Postgres + Realtime. The score and the narrative are still
//                     computed locally (lib/matching.ts, lib/hooks.ts); the
//                     `compatibility` Edge Function is NOT invoked by the app.
//   - not configured -> everything falls back to local, in-browser behaviour
//     (see lib/api.ts), so `npm run dev` always shows a working demo.
//
// The anon key is public by design, but note that with RLS off it grants full
// read/write on these tables — fine for synthetic demo data, not for real ones.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * The client, or null when the project is not configured OR could not be built.
 *
 * The try/catch is not decoration. `createClient` throws on a key it does not
 * recognise, and this module is imported at the top of the app — so one bad
 * character in `.env.local` would take the whole demo down with a blank screen
 * instead of quietly falling back to the in-browser path. That is a real risk
 * now that the backend is actually switched on (it was never switched on before
 * 14 Oct — see the note in `.env.local`).
 */
function buildClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  } catch (error) {
    console.error(
      "[rentmate] Supabase is configured but the client could not be created — " +
        "running in local mode. Check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.",
      error,
    );
    return null;
  }
}

export const supabase: SupabaseClient | null = buildClient();

export const isSupabaseConfigured = supabase !== null;

export const backendMode: "supabase" | "local" = supabase ? "supabase" : "local";
import { createClient, SupabaseClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey)
}

/** Shared browser client (persists the landlord session in localStorage). */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return client
}

export type AmenityRow = {
  id: string
  name_en: string
  name_zh: string
}
