import { mapApiUrl } from "./api-base"
import { getSupabase } from "./supabase"
import { getStoredEmail } from "./demo-session"
import { demoOwnListings } from "./demoListings"

/**
 * The local demo owner. On a machine with no Supabase env this is the only
 * owner that can sign in, and it signs in *locally* — no auth round-trip.
 * The dashboard detects that state and reads the synthetic listing pool.
 */
export const DEMO_OWNER_EMAIL = "testing@rentmate.local"

export type OwnListing = {
  id: string
  title: string
  address: string
  district: string
  price: number
  bedrooms: number
  bathrooms: number
  status: "available" | "rented" | "hidden"
  createdAt: string
}

export type NewListingInput = {
  title_en: string
  address: string
  district: string
  monthly_rent: number
  bedrooms: number
  bathrooms: number
  area_sqft: number
  property_type: string
  latitude?: number
  longitude?: number
}

async function authHeader(): Promise<Record<string, string>> {
  const sb = getSupabase()
  const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } }
  const token = data.session?.access_token
  if (!token) throw new Error("Please sign in again.")
  return { Authorization: `Bearer ${token}` }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(mapApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  if (!res.ok) {
    let message = text
    try {
      const j = JSON.parse(text)
      message =
        typeof j.error === "string" ? j.error : JSON.stringify(j.error ?? j)
    } catch {
      /* keep text */
    }
    throw new Error(message || `Request failed (${res.status})`)
  }
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export function registerAsLandlord(displayName: string) {
  return request<{ id: string; displayName: string }>("/api/landlord/me", {
    method: "POST",
    body: JSON.stringify({ displayName }),
  })
}

async function hasSupabaseSession(): Promise<boolean> {
  const sb = getSupabase()
  if (!sb) return false
  const { data } = await sb.auth.getSession()
  return Boolean(data.session)
}

/**
 * True when the signed-in owner is the demo account with no Supabase session
 * behind it — exactly what the one-click demo login on /landlord-entry
 * creates. In that state there is no backend to talk to, so reads fall back
 * to the synthetic pool and the UI refuses writes instead of failing.
 *
 * The check is on the SESSION, not the client: a real sign-in with the demo
 * account (Supabase env present, session live) still uses the live API.
 */
export async function isDemoOwnerSession(): Promise<boolean> {
  return getStoredEmail() === DEMO_OWNER_EMAIL && !(await hasSupabaseSession())
}

export async function fetchOwnListingsResult(): Promise<{
  listings: OwnListing[]
  /** "demo" = synthetic pool, because there is no live session to read from. */
  source: "live" | "demo"
}> {
  if (await isDemoOwnerSession()) {
    return { listings: demoOwnListings(), source: "demo" }
  }
  try {
    const r = await request<{ listings: OwnListing[] }>("/api/landlord/listings")
    return { listings: r.listings, source: "live" }
  } catch (e) {
    // A missing/expired session is a genuine auth failure — rethrow so the
    // caller can sign the user out. Anything else (map API down, proxy
    // refused, 404 on a static host) keeps the demo running on the pool.
    if (e instanceof Error && /sign in|session/i.test(e.message)) throw e
    return { listings: demoOwnListings(), source: "demo" }
  }
}

export async function fetchOwnListings(): Promise<OwnListing[]> {
  return (await fetchOwnListingsResult()).listings
}

export function createListing(input: NewListingInput) {
  return request<{ id: string }>("/api/listings", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function setListingStatus(id: string, status: OwnListing["status"]) {
  return request<{ ok: true }>(`/api/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export function removeListing(id: string) {
  return request<{ ok: true }>(`/api/listings/${id}`, { method: "DELETE" })
}
