import { config } from "../config.js"
import { getPool } from "../db.js"
import { mapDbStatusToApi, mapStatusToDb } from "../lib/bbox.js"
import { getSupabaseAdmin, hasDirectDatabase } from "../supabase-client.js"

export type ListingRow = {
  id: string
  title_en: string
  monthly_rent: number
  bedrooms: number
  bathrooms: number
  district: string
  latitude: number
  longitude: number
  status: string
  thumbnail: string | null
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

export async function queryListings(options: {
  status: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bbox?: [number, number, number, number]
  lat?: number
  lng?: number
  radius?: number
}): Promise<{ rows: ListingRow[]; truncated: boolean }> {
  const dbStatus = mapStatusToDb(options.status)
  const limit = config.listingsMaxResults + 1

  if (hasDirectDatabase()) {
    return queryViaPg(options, dbStatus, limit)
  }
  return queryViaSupabase(options, dbStatus, limit)
}

async function queryViaSupabase(
  options: {
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
    bbox?: [number, number, number, number]
    lat?: number
    lng?: number
    radius?: number
  },
  dbStatus: string,
  limit: number,
): Promise<{ rows: ListingRow[]; truncated: boolean }> {
  const sb = getSupabaseAdmin()
  let q = sb
    .from("properties")
    .select(
      "id, title_en, monthly_rent, bedrooms, bathrooms, district, latitude, longitude, status, property_images(image_url, display_order)",
    )
    .eq("status", dbStatus)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (options.minPrice != null) q = q.gte("monthly_rent", options.minPrice)
  if (options.maxPrice != null) q = q.lte("monthly_rent", options.maxPrice)
  if (options.bedrooms != null) q = q.gte("bedrooms", options.bedrooms)

  if (options.bbox) {
    const [west, south, east, north] = options.bbox
    q = q
      .gte("longitude", west)
      .lte("longitude", east)
      .gte("latitude", south)
      .lte("latitude", north)
  }

  const { data, error } = await q
  if (error) throw new Error(error.message)

  let rows = (data ?? []).map((r) => {
    const images = (r.property_images as { image_url: string; display_order: number }[] | null) ?? []
    images.sort((a, b) => a.display_order - b.display_order)
    return {
      id: r.id as string,
      title_en: r.title_en as string,
      monthly_rent: Number(r.monthly_rent),
      bedrooms: r.bedrooms as number,
      bathrooms: r.bathrooms as number,
      district: r.district as string,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      status: r.status as string,
      thumbnail: images[0]?.image_url ?? null,
    }
  })

  if (
    options.lat != null &&
    options.lng != null &&
    options.radius != null &&
    !options.bbox
  ) {
    rows = rows.filter(
      (r) =>
        haversineM(options.lat!, options.lng!, r.latitude, r.longitude) <=
        options.radius!,
    )
  }

  const truncated = rows.length > config.listingsMaxResults
  if (truncated) rows = rows.slice(0, config.listingsMaxResults)
  return { rows, truncated }
}

async function queryViaPg(
  options: {
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
    bbox?: [number, number, number, number]
    lat?: number
    lng?: number
    radius?: number
  },
  dbStatus: string,
  limit: number,
): Promise<{ rows: ListingRow[]; truncated: boolean }> {
  const pool = getPool()
  const params: unknown[] = [dbStatus]
  let where = `p.status = $1::public.property_status and p.latitude is not null and p.longitude is not null`

  if (options.minPrice != null) {
    params.push(options.minPrice)
    where += ` and p.monthly_rent >= $${params.length}`
  }
  if (options.maxPrice != null) {
    params.push(options.maxPrice)
    where += ` and p.monthly_rent <= $${params.length}`
  }
  if (options.bedrooms != null) {
    params.push(options.bedrooms)
    where += ` and p.bedrooms >= $${params.length}`
  }

  if (options.bbox) {
    const [west, south, east, north] = options.bbox
    params.push(west, south, east, north)
    const w = params.length - 3
    const s = params.length - 2
    const e = params.length - 1
    const n = params.length
    where += ` and p.longitude between $${w} and $${e}
               and p.latitude between $${s} and $${n}`
  } else if (
    options.lat != null &&
    options.lng != null &&
    options.radius != null
  ) {
    params.push(options.lat, options.lng, options.radius)
    const li = params.length
    where += ` and (
      6371000 * acos(
        least(1, greatest(-1,
          cos(radians($${li - 2})) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians($${li - 1})) +
          sin(radians($${li - 2})) * sin(radians(p.latitude))
        ))
      )
    ) <= $${li}`
  }

  params.push(limit)
  const sql = `
    select p.id, p.title_en, p.monthly_rent, p.bedrooms, p.bathrooms, p.district,
           p.latitude, p.longitude, p.status,
           (select pi.image_url from public.property_images pi
            where pi.property_id = p.id order by pi.display_order limit 1) as thumbnail
    from public.properties p
    where ${where}
    order by p.created_at desc
    limit $${params.length}
  `
  const { rows } = await pool.query(sql, params)
  const truncated = rows.length > config.listingsMaxResults
  const slice = truncated ? rows.slice(0, config.listingsMaxResults) : rows
  return {
    rows: slice.map((r) => ({
      id: r.id,
      title_en: r.title_en,
      monthly_rent: Number(r.monthly_rent),
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      district: r.district,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      status: r.status,
      thumbnail: r.thumbnail,
    })),
    truncated,
  }
}

export function rowsToGeoJson(rows: ListingRow[]) {
  return rows.map((r) => ({
    type: "Feature" as const,
    geometry: {
      type: "Point" as const,
      coordinates: [r.longitude, r.latitude],
    },
    properties: {
      id: r.id,
      title: r.title_en,
      price: r.monthly_rent,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      district: r.district,
      thumbnail: r.thumbnail,
      status: mapDbStatusToApi(r.status),
    },
  }))
}

export async function getPropertyLatLng(
  id: string,
): Promise<{ lat: number; lng: number } | null> {
  if (hasDirectDatabase()) {
    const pool = getPool()
    const { rows } = await pool.query<{ latitude: string; longitude: string }>(
      `select latitude, longitude from public.properties where id = $1`,
      [id],
    )
    if (!rows[0]?.latitude) return null
    return {
      lat: Number(rows[0].latitude),
      lng: Number(rows[0].longitude),
    }
  }
  const sb = getSupabaseAdmin()
  const { data, error } = await sb
    .from("properties")
    .select("latitude, longitude")
    .eq("id", id)
    .maybeSingle()
  if (error || !data?.latitude) return null
  return { lat: Number(data.latitude), lng: Number(data.longitude) }
}
