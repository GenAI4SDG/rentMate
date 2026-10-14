// The Homes half of the backend: the listing pool, and the state that is yours.
//
// Backed by four tables added in
// backend/supabase/migrations/20261014150000_rentmate_homes.sql:
//   demo_listings        the pool the Homes tab browses (240 rows, synthetic)
//   saved_listings       your shortlist, with your note and your status
//   conversation_listings a home you sent into a conversation
//   viewings             the viewing you actually agreed to
//
// EVERY FUNCTION HERE DEGRADES TO LOCAL. `supabase` is null when the project is
// not configured, and every call is wrapped so a missing table, a network drop
// or a policy error leaves the app running on the in-browser fallback rather
// than showing an empty screen. The demo has to work with `npm run dev` and no
// backend at all — that is the whole point of the local path in lib/api.ts.
//
// WHY localStorage IS STILL WRITTEN FIRST: the UI reads `personal` from
// component state, which is seeded from localStorage synchronously on mount.
// Postgres is the durable, cross-device, shared copy — it is not on the critical
// path for rendering, and it must never be the reason a click feels slow.

import { supabase } from "./supabase"
import {
  LISTINGS,
  listingFromRow,
  type Listing,
  type ListingRow,
  type ListingStatus,
} from "./listings"
import type { PersonalState, Viewing } from "./personalStore"

/** How many listings the pool should hold. The local fallback has fewer. */
export const REMOTE_LISTING_LIMIT = 500

/**
 * The listing pool: Postgres when configured, the local generator otherwise.
 *
 * Returns the local pool unchanged on ANY failure, so callers never have to
 * handle "no listings". An empty table is treated as a failure too — a Homes tab
 * with nothing in it is worse than the built-in pool.
 */
export async function loadListingPool(): Promise<Listing[]> {
  if (!supabase) return LISTINGS
  try {
    const { data, error } = await supabase
      .from("demo_listings")
      .select(
        "id, title, district, monthly_rent, bedrooms, bathrooms, area_sqft, near_mtr, rating, image_key, map_x, map_y, tips",
      )
      .order("id", { ascending: true })
      .limit(REMOTE_LISTING_LIMIT)
    if (error || !data || data.length === 0) return LISTINGS
    return (data as ListingRow[]).map(listingFromRow)
  } catch {
    return LISTINGS
  }
}

type SavedRow = {
  listing_id: number
  note: string | null
  status: ListingStatus
}

type ViewingRow = {
  id: string
  listing_id: number
  match_email: string
  when_text: string
  confirmed: boolean
}

/**
 * Read your saved homes, notes and viewings.
 *
 * Returns null — not an empty state — when there is nothing to merge, so the
 * caller can tell "the server has no opinion" apart from "the server says you
 * have saved nothing". Overwriting a local shortlist with an empty remote one
 * would lose work, so that distinction matters.
 */
export async function loadRemotePersonal(
  email: string,
): Promise<Partial<PersonalState> | null> {
  if (!supabase) return null
  const who = email.trim().toLowerCase()
  try {
    const [saved, attachments, viewings] = await Promise.all([
      supabase.from("saved_listings").select("listing_id, note, status").eq("email", who),
      supabase
        .from("conversation_listings")
        .select("conversation_id, listing_id")
        .eq("added_by_email", who),
      supabase
        .from("viewings")
        .select("id, listing_id, match_email, when_text, confirmed")
        .eq("match_email", who),
    ])

    if (saved.error && attachments.error && viewings.error) return null

    const savedRows = (saved.data ?? []) as SavedRow[]
    const attachmentRows = (attachments.data ?? []) as {
      conversation_id: string
      listing_id: number
    }[]
    const viewingRows = (viewings.data ?? []) as ViewingRow[]

    if (
      savedRows.length === 0 &&
      attachmentRows.length === 0 &&
      viewingRows.length === 0
    ) {
      return null
    }

    const notes: Record<string, string> = {}
    const status: Record<string, ListingStatus> = {}
    for (const row of savedRows) {
      if (row.note) notes[String(row.listing_id)] = row.note
      status[String(row.listing_id)] = row.status
    }

    const attached: Record<string, number[]> = {}
    for (const row of attachmentRows) {
      attached[row.conversation_id] = [
        ...(attached[row.conversation_id] ?? []),
        row.listing_id,
      ]
    }

    return {
      saved: savedRows.map((row) => row.listing_id),
      notes,
      status,
      attached,
      viewings: viewingRows.map<Viewing>((row) => ({
        id: row.id,
        // The viewing is stored per conversation; the UI keys viewings by the
        // person you are going with, which is what `matchId` carries.
        matchId: row.match_email,
        listingId: row.listing_id,
        when: row.when_text,
        confirmed: row.confirmed,
      })),
    }
  } catch {
    return null
  }
}

/**
 * Write the whole personal state up. Fire-and-forget by design: the caller has
 * already saved locally, and a failed sync must not surface as an error the user
 * cannot act on.
 *
 * `saved_listings` is reconciled by delete-then-insert because the shortlist is
 * small (tens of rows) and a diff would be more code than it is worth. The other
 * two tables are append-only in practice.
 */
export async function saveRemotePersonal(
  email: string,
  state: PersonalState,
): Promise<void> {
  if (!supabase) return
  const who = email.trim().toLowerCase()
  const client = supabase
  try {
    const rows = state.saved.map((listingId) => ({
      email: who,
      listing_id: listingId,
      note: state.notes[String(listingId)] ?? "",
      status: (state.status[String(listingId)] ?? "available") as ListingStatus,
    }))

    if (rows.length > 0) {
      await client.from("saved_listings").upsert(rows, {
        onConflict: "email,listing_id",
      })
      // Drop the ones you removed, without touching the ones you kept.
      await client
        .from("saved_listings")
        .delete()
        .eq("email", who)
        .not("listing_id", "in", `(${state.saved.join(",")})`)
    } else {
      await client.from("saved_listings").delete().eq("email", who)
    }

    const attachments = Object.entries(state.attached).flatMap(
      ([conversationId, listingIds]) =>
        listingIds.map((listingId) => ({
          conversation_id: conversationId,
          listing_id: listingId,
          added_by_email: who,
        })),
    )
    if (attachments.length > 0) {
      await client.from("conversation_listings").upsert(attachments, {
        onConflict: "conversation_id,listing_id",
        ignoreDuplicates: true,
      })
    }

    const viewings = state.viewings.map((viewing) => ({
      id: viewing.id,
      conversation_id: viewing.matchId,
      listing_id: viewing.listingId,
      match_email: who,
      other_email: viewing.matchId,
      when_text: viewing.when,
      confirmed: viewing.confirmed,
    }))
    if (viewings.length > 0) {
      await client.from("viewings").upsert(viewings, {
        onConflict: "conversation_id,listing_id",
      })
    }
  } catch {
    // Best effort. localStorage already has it.
  }
}

/**
 * Remove everything this email stored on the server. Used by "Reset account" —
 * logging out deliberately does NOT call this.
 */
export async function deleteRemotePersonal(email: string): Promise<void> {
  if (!supabase) return
  const who = email.trim().toLowerCase()
  try {
    await Promise.all([
      supabase.from("saved_listings").delete().eq("email", who),
      supabase.from("conversation_listings").delete().eq("added_by_email", who),
      supabase.from("viewings").delete().eq("match_email", who),
    ])
  } catch {
    // ignore
  }
}
