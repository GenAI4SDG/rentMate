import { mapApiUrl } from "./api-base"
import { getSupabase } from "./supabase"

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

export async function fetchOwnListings(): Promise<OwnListing[]> {
  const r = await request<{ listings: OwnListing[] }>("/api/landlord/listings")
  return r.listings
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
