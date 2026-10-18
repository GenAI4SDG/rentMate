import { config } from "../config.js"
import { getPool } from "../db.js"
import { getGeocodeMemory, setGeocodeMemory } from "./cache.js"
import { throttleNominatim } from "./throttle.js"

export type GeocodeResult = {
  lat: number
  lng: number
  displayName: string
  boundingbox: string[]
}

function normalizeAddressKey(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ")
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": config.osmUserAgent },
    })
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function readDbCache(key: string): Promise<GeocodeResult | null> {
  const pool = getPool()
  const { rows } = await pool.query<{
    lat: string
    lng: string
    display_name: string | null
    boundingbox: string[] | null
  }>(
    `select lat, lng, display_name, boundingbox from public.geocode_cache where address_key = $1`,
    [key],
  )
  if (!rows[0]) return null
  return {
    lat: Number(rows[0].lat),
    lng: Number(rows[0].lng),
    displayName: rows[0].display_name ?? key,
    boundingbox: rows[0].boundingbox ?? [],
  }
}

async function writeDbCache(key: string, result: GeocodeResult): Promise<void> {
  const pool = getPool()
  await pool.query(
    `insert into public.geocode_cache (address_key, lat, lng, display_name, boundingbox)
     values ($1, $2, $3, $4, $5)
     on conflict (address_key) do update set
       lat = excluded.lat, lng = excluded.lng,
       display_name = excluded.display_name, boundingbox = excluded.boundingbox`,
    [
      key,
      result.lat,
      result.lng,
      result.displayName,
      JSON.stringify(result.boundingbox),
    ],
  )
}

export async function geocode(address: string): Promise<GeocodeResult | null> {
  const key = normalizeAddressKey(address)
  if (!key) return null

  const mem = getGeocodeMemory(key)
  if (mem) return mem

  try {
    const db = await readDbCache(key)
    if (db) {
      setGeocodeMemory(key, db)
      return db
    }
  } catch {
    /* table may not exist yet */
  }

  await throttleNominatim()
  const url = `${config.nominatimUrl.replace(/\/$/, "")}/search?format=json&limit=1&q=${encodeURIComponent(address)}`
  const data = (await fetchJson(url)) as Array<{
    lat: string
    lon: string
    display_name: string
    boundingbox: string[]
  }>
  if (!data?.length) return null

  const result: GeocodeResult = {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
    boundingbox: data[0].boundingbox ?? [],
  }

  setGeocodeMemory(key, result)
  try {
    await writeDbCache(key, result)
  } catch {
    /* ignore cache write failures */
  }
  return result
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  await throttleNominatim()
  const url = `${config.nominatimUrl.replace(/\/$/, "")}/reverse?format=json&lat=${lat}&lon=${lng}`
  const data = (await fetchJson(url)) as { display_name?: string }
  return data.display_name ?? null
}
