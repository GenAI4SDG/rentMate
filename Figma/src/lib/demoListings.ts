// Offline demo pool for the map and the owner dashboard.
//
// WHY THIS EXISTS: the student map reads from the map API (backend/server,
// port 3001). When that service is not running — a plain `vite dev` with no
// backend, or a static deploy with no VITE_MAP_API_URL — `/api/listings` fails
// and the "Find a flat" tab used to go blank with a proxy error in the console
// (`connect ECONNREFUSED 127.0.0.1:3001`). These are the same synthetic
// listings the rest of the demo already uses (lib/listings.ts), projected back
// into lat/lng, so the map still shows pins, the price/bedroom filters still do
// something, and district search still flies somewhere.
//
// HONESTY: every feature here is synthetic. Pins are district-accurate, not
// building-accurate (see `unproject()` in lib/listings.ts). Callers must badge
// this pool as demo data whenever it is the source — never silently.

import { DISTRICT_CENTROIDS, LISTINGS, unproject } from "./listings"
import type { ListingFeature } from "./listingsApi"
import type { OwnListing } from "./landlordApi"

/** The synthetic pool as GeoJSON, in the shape the map API returns. Built once. */
export const DEMO_LISTING_FEATURES: ListingFeature[] = LISTINGS.map((l) => {
  const { lat, lng } = unproject(l.x, l.y)
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: {
      id: `demo-${l.id}`,
      title: l.title,
      price: l.price,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      district: l.area,
      thumbnail: l.image,
      status: "available",
    },
  }
})

/**
 * The offline answer to `GET /api/listings`. Mirrors the backend's PostgreSQL
 * filters exactly (data/query-listings.ts): bedrooms is a floor (`gte`), price
 * is inclusive on both ends, bbox is [west, south, east, north].
 */
export function demoListingsInBbox(
  bbox: [number, number, number, number],
  filters: { minPrice?: number; maxPrice?: number; bedrooms?: number },
): ListingFeature[] {
  const [west, south, east, north] = bbox
  return DEMO_LISTING_FEATURES.filter((f) => {
    const [lng, lat] = f.geometry.coordinates
    if (lat < south || lat > north || lng < west || lng > east) return false
    const p = f.properties
    if (filters.minPrice != null && p.price < filters.minPrice) return false
    if (filters.maxPrice != null && p.price > filters.maxPrice) return false
    if (filters.bedrooms != null && p.bedrooms < filters.bedrooms) return false
    return true
  })
}

// Spellings people type that are not the district keys themselves. Keys are
// lower-case with punctuation stripped — the query is normalised the same way
// before lookup, so "Mong Kok," and "mongkok" both land here.
const GEOCODE_ALIASES: Record<string, string> = {
  mongkok: "Mong Kok",
  "prince edward": "Mong Kok",
  tko: "Tseung Kwan O",
  mos: "Ma On Shan",
  cuhk: "Sha Tin",
  hku: "Sai Ying Pun",
  polyu: "Hung Hom",
  cityu: "Kowloon Tong",
  hkust: "Tseung Kwan O",
}

/**
 * Offline answer to `GET /api/geocode`. Matches a district name (or a handful
 * of aliases / campus names) against the real district centroids and returns
 * the Nominatim-shaped response the caller expects. Returns null when nothing
 * matches — an address search genuinely needs the live geocoder, and pretending
 * otherwise would fly the map to the wrong place.
 */
export function demoGeocode(q: string): ListingGeocode | null {
  const needle = q.trim().toLowerCase().replace(/[.,]/g, "")
  if (!needle) return null

  const alias = GEOCODE_ALIASES[needle]
  if (alias && DISTRICT_CENTROIDS[alias]) {
    return centroidResponse(alias, DISTRICT_CENTROIDS[alias], q.trim())
  }

  // Longest district key contained in the query wins ("sha tin new town").
  const hit = Object.keys(DISTRICT_CENTROIDS)
    .filter((d) => needle.includes(d.toLowerCase()))
    .sort((a, b) => b.length - a.length)[0]
  if (hit) return centroidResponse(hit, DISTRICT_CENTROIDS[hit], q.trim())

  return null
}

function centroidResponse(
  district: string,
  [lat, lng]: [number, number],
  displayQuery: string,
): ListingGeocode {
  // ~1 km box, so a flyTo lands inside the district rather than on one pin.
  const d = 0.005
  return {
    lat,
    lng,
    displayName: `${displayQuery} — ${district} (district centre, demo)`,
    boundingbox: [
      String(lat - d),
      String(lat + d),
      String(lng - d),
      String(lng + d),
    ],
  }
}

/** Same response shape as `geocodeQuery` in lib/listingsApi. */
type ListingGeocode = {
  lat: number
  lng: number
  displayName: string
  boundingbox: string[]
}

/**
 * The offline answer to `GET /api/landlord/listings` — the demo owner's own
 * listings, drawn from the same synthetic pool the student map falls back to.
 * Read-only by nature: with no map API there is nothing to write to, and the
 * dashboard disables the mutation buttons rather than failing on click.
 */
export function demoOwnListings(): OwnListing[] {
  return DEMO_LISTING_FEATURES.slice(0, 12).map((f, index) => ({
    id: f.properties.id,
    title: f.properties.title,
    address: `${f.properties.district}, Hong Kong (demo)`,
    district: f.properties.district,
    price: f.properties.price,
    bedrooms: f.properties.bedrooms,
    bathrooms: f.properties.bathrooms,
    status: index % 9 === 4 ? "rented" : "available",
    createdAt: "2026-10-01T00:00:00.000Z",
  }))
}
