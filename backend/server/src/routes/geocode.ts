import { Router } from "express"
import { geocode } from "../geo/nominatim.js"

export const geocodeRouter = Router()

geocodeRouter.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : ""
  if (q.length < 3) {
    return res.status(400).json({ error: "Query q must be at least 3 characters" })
  }
  const result = await geocode(q.includes("Hong Kong") ? q : `${q}, Hong Kong`)
  if (!result) {
    return res.status(404).json({ error: "No results" })
  }
  return res.json({
    lat: result.lat,
    lng: result.lng,
    boundingbox: result.boundingbox,
    displayName: result.displayName,
  })
})
