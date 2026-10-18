import { config } from "../config.js"
import { getNearbyMemory, setNearbyMemory } from "./cache.js"

export type NearbyPlaceType =
  | "transit"
  | "school"
  | "supermarket"
  | "hospital"

export type NearbyPlace = {
  type: NearbyPlaceType
  name: string
  lat: number
  lng: number
  distanceMeters: number
}

const TYPE_FILTERS: Record<NearbyPlaceType, string> = {
  transit: `(node["railway"="station"](around:RADIUS,LAT,LNG);node["highway"="bus_stop"](around:RADIUS,LAT,LNG););`,
  school: `node["amenity"="school"](around:RADIUS,LAT,LNG);`,
  supermarket: `node["shop"="supermarket"](around:RADIUS,LAT,LNG);`,
  hospital: `node["amenity"="hospital"](around:RADIUS,LAT,LNG);`,
}

function haversineM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export async function nearbyPlaces(
  lat: number,
  lng: number,
  radiusMeters: number,
  types: NearbyPlaceType[],
): Promise<NearbyPlace[]> {
  const cacheKey = `${lat.toFixed(5)}:${lng.toFixed(5)}:${radiusMeters}:${types.sort().join(",")}`
  const cached = getNearbyMemory(cacheKey)
  if (cached) return cached as NearbyPlace[]

  const parts = types.map((t) =>
    TYPE_FILTERS[t]
      .replace(/RADIUS/g, String(radiusMeters))
      .replace(/LAT/g, String(lat))
      .replace(/LNG/g, String(lng)),
  )
  const query = `[out:json][timeout:25];(${parts.join("")});out body 30;`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(config.overpassUrl, {
      method: "POST",
      body: query,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": config.osmUserAgent,
      },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`)
    const json = (await res.json()) as {
      elements: Array<{
        lat?: number
        lon?: number
        tags?: { name?: string; amenity?: string; shop?: string }
      }>
    }

    const places: NearbyPlace[] = []
    for (const el of json.elements ?? []) {
      if (el.lat == null || el.lon == null) continue
      const name = el.tags?.name ?? "Unnamed"
      let type: NearbyPlaceType = "transit"
      if (types.includes("school")) type = "school"
      // Refine by checking which filter matched — simplified: tag inspection
      const tags = el.tags ?? {}
      if (tags.amenity === "school") type = "school"
      else if (tags.shop === "supermarket") type = "supermarket"
      else if (tags.amenity === "hospital") type = "hospital"
      else type = "transit"

      if (!types.includes(type)) continue

      places.push({
        type,
        name,
        lat: el.lat,
        lng: el.lon,
        distanceMeters: Math.round(haversineM(lat, lng, el.lat, el.lon)),
      })
    }

    places.sort((a, b) => a.distanceMeters - b.distanceMeters)
    setNearbyMemory(cacheKey, places)
    return places
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}
