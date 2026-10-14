// Everything about HOMES that belongs to you alone.
//
// WHY THIS EXISTS: saved listings used to live in `Matches` component state and
// were rendered as a "shortlist shared with {person}", which was wrong twice —
// it was tied to whichever conversation happened to be open, and it vanished on
// reload. The owner's call (14 Oct): treat homes as a personal shopping cart.
// Your saved homes, your notes and your viewing agreements are yours; attaching
// one to a conversation is a separate, explicit action.
//
// WHERE THIS IS STORED (updated 14 Oct, second pass): localStorage is still the
// store the UI renders from — it is synchronous, it works with no backend at
// all, and it survives a flaky network. It is no longer the ONLY store: when a
// Supabase project is configured, lib/homesApi.ts mirrors the same state into
// `saved_listings`, `conversation_listings` and `viewings`, so it follows you to
// another device and so the person you sent a home to can actually see it.
//
// The honest caveat has not gone away: RLS is OFF on those tables (there is no
// auth.users to key a policy on), so anyone holding the anon key can read and
// write them. That is acceptable for synthetic demo listings and not for real
// student data — see the U7 note in lib/supabase.ts before pointing this at
// anything real.

import type { ListingStatus } from "./listings"

export type Viewing = {
  id: string
  /** Which connection the viewing is with. */
  matchId: string
  listingId: number
  /** Free text, agreed in the chat. Not a calendar event. */
  when: string
  /** True once both sides have ticked the common-sense check. */
  confirmed: boolean
}

export type PersonalState = {
  /** Listing ids you saved. Yours alone — never tied to a conversation. */
  saved: number[]
  /** Your own note per listing id. */
  notes: Record<string, string>
  /** Status you have set on a listing (available / viewing / taken). */
  status: Record<string, ListingStatus>
  /** Listing ids you pushed into a conversation, keyed by conversation id. */
  attached: Record<string, number[]>
  viewings: Viewing[]
  /**
   * Match ids you passed on. Also yours alone, and also not the chat's.
   *
   * Added 14 Oct, second pass. Before this, "not for me" advanced the deck and
   * forgot: reload the page and everyone you had rejected was back at the top.
   * Dismissing removes someone from the top tier of the deck; they only return
   * in the exhausted-recommendations tier, where the card says so.
   */
  dismissedMatches: string[]
}

export const EMPTY_PERSONAL: PersonalState = {
  saved: [],
  notes: {},
  status: {},
  attached: {},
  viewings: [],
  dismissedMatches: [],
}

/**
 * What the curated demo account starts with.
 *
 * The owner asked for the agent side of a booking to be visible ("this can be
 * displayed by hardcoding some examples into the demo account's saved page"),
 * and a booking that has fallen through is only visible if a booking exists in
 * the first place. So the demo account opens with three saved homes covering
 * the three states — one you booked and the agent then cancelled, one you
 * booked and are still going to, one you have not booked at all. A normal
 * student account starts empty.
 *
 * Listing ids are stable: `LISTINGS` is generated from a fixed seed, so 1, 14
 * and 27 are the same three flats every time. If `LISTING_COUNT` ever drops
 * below 28 the seed silently loses entries — `npm run smoke` asserts the ids
 * still resolve, so that shows up as a failing check rather than an empty page.
 */
export const DEMO_SEED: PersonalState = {
  saved: [1, 14, 27],
  notes: {
    "1": "Agent said the landlord is flexible on a 12-month term. Ask again in person.",
    "14": "Third floor, no lift — count the stairs with a bag before you commit.",
    "27": "Photos are older than the listing. The kitchen was redone after them.",
  },
  status: {
    // 1 — booked, then the agent wrote back to cancel. See lib/agentUpdates.ts.
    "1": "taken",
    // 14 — booked and still going ahead.
    "14": "viewing",
    // 27 — saved and not booked; no status entry means "available".
  },
  attached: {},
  viewings: [
    {
      id: "demo-viewing-14",
      // "m1" is a stable id in CURATED_CAST (lib/demoData.ts) — the curated
      // cast only, so this never attaches itself to a real student's account.
      matchId: "m1",
      listingId: 14,
      when: "Sat 14:00",
      confirmed: true,
    },
  ],
  dismissedMatches: [],
}

const key = (email: string) => `rentmate.personal.${email.trim().toLowerCase()}`

export function loadPersonal(email: string): PersonalState {
  try {
    const raw = localStorage.getItem(key(email))
    if (!raw) return EMPTY_PERSONAL
    const parsed = JSON.parse(raw) as Partial<PersonalState>
    return {
      saved: Array.isArray(parsed.saved) ? parsed.saved : [],
      notes: parsed.notes ?? {},
      status: parsed.status ?? {},
      attached: parsed.attached ?? {},
      viewings: Array.isArray(parsed.viewings) ? parsed.viewings : [],
      dismissedMatches: Array.isArray(parsed.dismissedMatches)
        ? parsed.dismissedMatches
        : [],
    }
  } catch {
    return EMPTY_PERSONAL
  }
}

export function savePersonal(email: string, state: PersonalState): void {
  try {
    localStorage.setItem(key(email), JSON.stringify(state))
  } catch {
    // A full or blocked storage quota must never break the app.
  }
}

export function clearPersonal(email: string): void {
  try {
    localStorage.removeItem(key(email))
  } catch {
    // ignore
  }
}
