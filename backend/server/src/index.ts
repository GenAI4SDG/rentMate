import "./load-env.js"
import cors from "cors"
import express from "express"
import rateLimit from "express-rate-limit"
import { assertServerConfig, config } from "./config.js"
import { geocodeRouter } from "./routes/geocode.js"
import { landlordRouter } from "./routes/landlord.js"
import { listingsRouter } from "./routes/listings.js"
import { tryAutoSeed } from "./startup-seed.js"

assertServerConfig()

const app = express()
// Behind Render/Railway proxies: needed for correct client IPs in rate limiting.
app.set("trust proxy", 1)

// CORS_ORIGINS=https://your-site.vercel.app,https://custom.domain  (comma-separated)
// Unset = allow any origin (fine for local dev).
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins.length
      ? (origin, cb) =>
          cb(null, !origin || allowedOrigins.includes(origin.replace(/\/$/, "")))
      : true,
  }),
)
app.use(express.json({ limit: "50kb" }))

const readLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  standardHeaders: "draft-7",
  legacyHeaders: false,
})
// Geocode/nearby proxy Nominatim & Overpass (strict upstream usage policies).
const geoLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
})
const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
})

app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>RentMate map API</title>
<style>body{font-family:system-ui;max-width:640px;margin:48px auto;padding:0 20px;line-height:1.5}
code{background:#f3f3f3;padding:2px 6px;border-radius:4px}a{color:#c96b48}</style></head>
<body>
<h1>RentMate map API is running</h1>
<p>This is the <strong>backend API</strong>, not the RentMate website.</p>
<ul>
<li><a href="/api/health">/api/health</a> — server + Supabase config</li>
<li><code>/api/listings?bbox=113.8,22.1,114.5,22.5&amp;status=available</code> — map pins (GeoJSON)</li>
<li><code>/api/geocode?q=Sha+Tin</code> — address search</li>
</ul>
</body></html>`)
})

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    supabase: Boolean(config.supabaseUrl),
    serviceRole: Boolean(config.supabaseServiceRoleKey),
    directPostgres: Boolean(config.databaseUrl),
    corsRestricted: allowedOrigins.length > 0,
  })
})

app.use("/api/geocode", geoLimiter, geocodeRouter)
app.use("/api/landlord", writeLimiter, landlordRouter)
app.use(
  "/api/listings",
  (req, res, next) =>
    req.method === "GET" && /\/nearby$/.test(req.path)
      ? geoLimiter(req, res, next)
      : req.method === "GET"
        ? readLimiter(req, res, next)
        : writeLimiter(req, res, next),
  listingsRouter,
)

const host = process.env.HOST ?? "0.0.0.0"
app.listen(config.port, host, () => {
  console.log(`RentMate map API listening on http://${host}:${config.port}`)
  void tryAutoSeed()
})
