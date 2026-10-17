import { Router } from "express"
import { z } from "zod"
import {
  getPropertyLatLng,
  queryListings,
  rowsToGeoJson,
} from "../data/query-listings.js"
import { geocode } from "../geo/nominatim.js"
import { nearbyPlaces, type NearbyPlaceType } from "../geo/overpass.js"
import { parseBboxParam } from "../lib/bbox.js"
import { config } from "../config.js"
import { getSupabaseAdmin } from "../supabase-client.js"

export const listingsRouter = Router()

listingsRouter.get("/", async (req, res) => {
  try {
    const status = String(req.query.status ?? "available")
    const minPrice = req.query.minPrice
      ? Number(req.query.minPrice)
      : undefined
    const maxPrice = req.query.maxPrice
      ? Number(req.query.maxPrice)
      : undefined
    const bedrooms = req.query.bedrooms
      ? Number(req.query.bedrooms)
      : undefined

    const bbox = parseBboxParam(
      typeof req.query.bbox === "string" ? req.query.bbox : undefined,
    )
    const lat = req.query.lat ? Number(req.query.lat) : undefined
    const lng = req.query.lng ? Number(req.query.lng) : undefined
    const radius = req.query.radius ? Number(req.query.radius) : undefined

    if (!bbox && (lat == null || lng == null || radius == null)) {
      return res.status(400).json({
        error: "Provide bbox=west,south,east,north or lat, lng, and radius",
      })
    }

    const { rows, truncated } = await queryListings({
      status,
      minPrice,
      maxPrice,
      bedrooms,
      bbox: bbox ?? undefined,
      lat,
      lng,
      radius,
    })

    return res.json({
      type: "FeatureCollection",
      features: rowsToGeoJson(rows),
      truncated,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Query failed"
    return res.status(500).json({ error: message })
  }
})

listingsRouter.get("/:id/nearby", async (req, res) => {
  const radius = Math.min(
    2000,
    Math.max(100, Number(req.query.radius ?? 500)),
  )
  const typesRaw = String(req.query.types ?? "transit,school,supermarket")
  const types = typesRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean) as NearbyPlaceType[]

  const coords = await getPropertyLatLng(req.params.id)
  if (!coords) {
    return res.status(404).json({ error: "Listing not found or missing coordinates" })
  }

  const places = await nearbyPlaces(coords.lat, coords.lng, radius, types)
  return res.json({ places, radiusMeters: radius })
})

const writeBodySchema = z.object({
  title_en: z.string().min(1),
  address: z.string().min(1),
  district: z.string().min(1),
  monthly_rent: z.number().positive(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  area_sqft: z.number().positive(),
  property_type: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  landlord_id: z.string().uuid(),
})

listingsRouter.post("/", async (req, res) => {
  if (!config.supabaseServiceRoleKey) {
    return res.status(503).json({
      error:
        "Listing create requires SUPABASE_SERVICE_ROLE_KEY in backend/server/.env.local",
    })
  }
  const parsed = writeBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }
  const body = parsed.data
  let lat = body.latitude
  let lng = body.longitude

  if (lat == null || lng == null) {
    const geo = await geocode(`${body.address}, Hong Kong`)
    if (!geo) {
      return res.status(422).json({
        error: "Geocoding failed; provide latitude/longitude or a clearer address",
      })
    }
    lat = geo.lat
    lng = geo.lng
  }

  const sb = getSupabaseAdmin()
  const { data, error } = await sb
    .from("properties")
    .insert({
      landlord_id: body.landlord_id,
      title_en: body.title_en,
      district: body.district,
      address: body.address,
      monthly_rent: body.monthly_rent,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      area_sqft: body.area_sqft,
      latitude: lat,
      longitude: lng,
      property_type: body.property_type,
      status: "active",
    })
    .select("id")
    .single()

  if (error) return res.status(500).json({ error: error.message })
  return res.status(201).json({ id: data.id, latitude: lat, longitude: lng })
})

listingsRouter.patch("/:id", async (req, res) => {
  if (!config.supabaseServiceRoleKey) {
    return res.status(503).json({ error: "PATCH requires SUPABASE_SERVICE_ROLE_KEY" })
  }
  const address = req.body.address as string | undefined
  if (address && req.body.latitude == null && req.body.longitude == null) {
    const geo = await geocode(`${address}, Hong Kong`)
    if (!geo) {
      return res.status(422).json({ error: "Geocoding failed for new address" })
    }
    req.body.latitude = geo.lat
    req.body.longitude = geo.lng
  }

  const allowed = [
    "title_en",
    "address",
    "district",
    "monthly_rent",
    "bedrooms",
    "bathrooms",
    "latitude",
    "longitude",
  ] as const
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) patch[key] = req.body[key]
  }
  if (!Object.keys(patch).length) {
    return res.status(400).json({ error: "No fields to update" })
  }

  const sb = getSupabaseAdmin()
  const { error } = await sb.from("properties").update(patch).eq("id", req.params.id)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ ok: true })
})
