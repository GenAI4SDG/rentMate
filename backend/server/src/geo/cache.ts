const memoryGeocode = new Map<
  string,
  { lat: number; lng: number; displayName: string; boundingbox: string[] }
>()

const memoryNearby = new Map<string, { at: number; data: unknown }>()
const NEARBY_TTL_MS = 24 * 60 * 60 * 1000

export function getGeocodeMemory(key: string) {
  return memoryGeocode.get(key) ?? null
}

export function setGeocodeMemory(
  key: string,
  value: {
    lat: number
    lng: number
    displayName: string
    boundingbox: string[]
  },
) {
  memoryGeocode.set(key, value)
}

export function getNearbyMemory(key: string) {
  const hit = memoryNearby.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > NEARBY_TTL_MS) {
    memoryNearby.delete(key)
    return null
  }
  return hit.data
}

export function setNearbyMemory(key: string, data: unknown) {
  memoryNearby.set(key, { at: Date.now(), data })
}
