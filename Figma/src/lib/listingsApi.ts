import { mapApiUrl } from "./api-base"

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
}

export type GeocodeResponse = {
  lat: number
  lng: number
  displayName: string
  boundingbox: string[]
}

export async function fetchListingsBbox(
  bbox: [number, number, number, number],
  filters: { minPrice?: number; maxPrice?: number; bedrooms?: number },
  signal?: AbortSignal,
): Promise<ListingsResponse> {
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

  const res = await fetch(mapApiUrl(`/api/listings?${params}`), { signal })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function geocodeQuery(q: string): Promise<GeocodeResponse> {
  const res = await fetch(mapApiUrl(`/api/geocode?q=${encodeURIComponent(q)}`))
  if (!res.ok) throw new Error("Geocode failed")
  return res.json()
}

export async function fetchNearby(
  id: string,
  radius = 500,
): Promise<{ places: Array<{ type: string; name: string; distanceMeters: number }> }> {
  const res = await fetch(
    mapApiUrl(
      `/api/listings/${id}/nearby?radius=${radius}&types=transit,school,supermarket`,
    ),
  )
  if (!res.ok) return { places: [] }
  return res.json()
}
