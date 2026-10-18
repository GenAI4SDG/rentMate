import { mapApiUrl } from "./api-base"
import { demoGeocode, demoListingsInBbox } from "./demoListings"

export type ListingFeature = {
  type: "Feature"
  geometry: { type: "Point"; coordinates: [number, number] }
  properties: {
    id: string
    title: string
    price: number
    bedrooms: number
    bathrooms: number
    district: string
    thumbnail: string | null
    status: string
  }
}

export type ListingsResponse = {
  type: "FeatureCollection"
  features: ListingFeature[]
  truncated?: boolean
  /**
   * Where the features came from. "demo" = the local synthetic pool, returned
   * because the map API was unreachable — the UI must badge it as such.
   */
  source?: "live" | "demo"
}

export type GeocodeResponse = {
  lat: number
  lng: number
  displayName: string
  boundingbox: string[]
}

/**
 * Latched the first time the map API fails, so a dead backend does not get
 * re-hit on every map moveend (which spams `ECONNREFUSED 127.0.0.1:3001` into
 * the console). Cleared by `resetMapApiStatus()` — wired to the "retry live
 * map" control — so starting the backend takes effect without a page reload.
 */
let mapApiDown = false

export function isMapApiDown(): boolean {
  return mapApiDown
}

export function resetMapApiStatus(): void {
  mapApiDown = false
}

function demoListingsResponse(
  bbox: [number, number, number, number],
  filters: { minPrice?: number; maxPrice?: number; bedrooms?: number },
): ListingsResponse {
  return {
    type: "FeatureCollection",
    features: demoListingsInBbox(bbox, filters),
    source: "demo",
  }
}

export async function fetchListingsBbox(
  bbox: [number, number, number, number],
  filters: { minPrice?: number; maxPrice?: number; bedrooms?: number },
  signal?: AbortSignal,
): Promise<ListingsResponse> {
  if (mapApiDown) return demoListingsResponse(bbox, filters)

  const params = new URLSearchParams({
    bbox: bbox.join(","),
    status: "available",
  })
  if (filters.minPrice != null)
    params.set("minPrice", String(filters.minPrice))
  if (filters.maxPrice != null)
    params.set("maxPrice", String(filters.maxPrice))
  if (filters.bedrooms != null)
    params.set("bedrooms", String(filters.bedrooms))

  try {
    const res = await fetch(mapApiUrl(`/api/listings?${params}`), { signal })
    if (!res.ok) throw new Error(`Map API returned ${res.status}`)
    const data = (await res.json()) as ListingsResponse
    return { ...data, source: "live" }
  } catch (e) {
    // An aborted request is a superseded one, not a failure — the caller is
    // already showing a newer query's result. Do not latch on it.
    if ((e as Error).name === "AbortError") throw e
    mapApiDown = true
    return demoListingsResponse(bbox, filters)
  }
}

export async function geocodeQuery(q: string): Promise<GeocodeResponse> {
  if (mapApiDown) {
    const demo = demoGeocode(q)
    if (demo) return demo
    throw new Error("Geocode failed")
  }

  try {
    const res = await fetch(mapApiUrl(`/api/geocode?q=${encodeURIComponent(q)}`))
    if (!res.ok) throw new Error("Geocode failed")
    return res.json()
  } catch {
    mapApiDown = true
    const demo = demoGeocode(q)
    if (demo) return demo
    throw new Error("Geocode failed")
  }
}

export async function fetchNearby(
  id: string,
  radius = 500,
): Promise<{ places: Array<{ type: string; name: string; distanceMeters: number }> }> {
  // Latched down, or the backend is simply unreachable — either way the map
  // UI already renders "No nearby data" for an empty list, so don't re-hit a
  // dead proxy every time a pin is selected.
  if (mapApiDown) return { places: [] }
  const res = await fetch(
    mapApiUrl(
      `/api/listings/${id}/nearby?radius=${radius}&types=transit,school,supermarket`,
    ),
  )
  if (!res.ok) return { places: [] }
  return res.json()
}
