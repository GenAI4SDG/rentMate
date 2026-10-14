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

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export const backendMode: "supabase" | "local" = isSupabaseConfigured ? "supabase" : "local";
