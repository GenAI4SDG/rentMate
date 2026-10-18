import { Router } from "express"
import { z } from "zod"
import { requireUser, type AuthedRequest } from "../auth.js"
import {
  getPropertyLatLng,
  queryListings,
  rowsToGeoJson,
} from "../data/query-listings.js"
import { geocode } from "../geo/nominatim.js"
import { nearbyPlaces, type NearbyPlaceType } from "../geo/overpass.js"
import { mapStatusToDb, parseBboxParam } from "../lib/bbox.js"
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

const createBodySchema = z.object({
  title_en: z.string().min(1).max(160),
  address: z.string().min(1).max(240),
  district: z.string().min(1).max(80),
  monthly_rent: z.number().positive().max(1_000_000),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  area_sqft: z.number().positive().max(20_000),
  property_type: z.string().min(1).max(40),
  latitude: z.number().min(21).max(23).optional(),
  longitude: z.number().min(113).max(115).optional(),
})

/** Create a listing owned by the signed-in landlord (id comes from the verified JWT). */
listingsRouter.post("/", requireUser, async (req, res) => {
  const { userId } = req as AuthedRequest
  const parsed = createBodySchema.safeParse(req.body)
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
  await sb.from("profiles").update({ role: "landlord" }).eq("id", userId)

  const { data, error } = await sb
    .from("properties")
    .insert({
      landlord_id: userId,
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

const patchBodySchema = z
  .object({
    title_en: z.string().min(1).max(160),
    address: z.string().min(1).max(240),
    district: z.string().min(1).max(80),
    monthly_rent: z.number().positive().max(1_000_000),
    bedrooms: z.number().int().min(0).max(20),
    bathrooms: z.number().int().min(0).max(20),
    latitude: z.number().min(21).max(23),
    longitude: z.number().min(113).max(115),
    /** API status: available | rented | hidden */
    status: z.enum(["available", "rented", "hidden"]),
  })
  .partial()

/** Update a listing — only its owner may do so. */
listingsRouter.patch("/:id", requireUser, async (req, res) => {
  const { userId } = req as AuthedRequest
  const parsed = patchBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() })
  }
  const body = { ...parsed.data }

  if (body.address && body.latitude == null && body.longitude == null) {
    const geo = await geocode(`${body.address}, Hong Kong`)
    if (!geo) {
      return res.status(422).json({ error: "Geocoding failed for new address" })
    }
    body.latitude = geo.lat
    body.longitude = geo.lng
  }

  const { status, ...rest } = body
  const patch: Record<string, unknown> = { ...rest }
  if (status) patch.status = mapStatusToDb(status)
  if (!Object.keys(patch).length) {
    return res.status(400).json({ error: "No fields to update" })
  }

  const { data, error } = await getSupabaseAdmin()
    .from("properties")
    .update(patch)
    .eq("id", req.params.id)
    .eq("landlord_id", userId)
    .select("id")

  if (error) return res.status(500).json({ error: error.message })
  if (!data?.length) {
    return res.status(404).json({ error: "Listing not found or not yours" })
  }
  return res.json({ ok: true })
})

/** Remove a listing from the public map (soft delete → archived). */
listingsRouter.delete("/:id", requireUser, async (req, res) => {
  const { userId } = req as AuthedRequest
  const { data, error } = await getSupabaseAdmin()
    .from("properties")
    .update({ status: "archived" })
    .eq("id", req.params.id)
    .eq("landlord_id", userId)
    .select("id")

  if (error) return res.status(500).json({ error: error.message })
  if (!data?.length) {
    return res.status(404).json({ error: "Listing not found or not yours" })
  }
  return res.json({ ok: true })
})
