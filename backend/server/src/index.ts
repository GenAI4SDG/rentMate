import "./load-env.js"
import cors from "cors"
import express from "express"
import { assertServerConfig, config } from "./config.js"
import { geocodeRouter } from "./routes/geocode.js"
import { listingsRouter } from "./routes/listings.js"
import { publicRouter } from "./routes/public.js"
import { tryAutoSeed } from "./startup-seed.js"

assertServerConfig()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>RentMate map API</title>
<style>body{font-family:system-ui;max-width:640px;margin:48px auto;padding:0 20px;line-height:1.5}
code{background:#f3f3f3;padding:2px 6px;border-radius:4px}a{color:#c96b48}</style></head>
<body>
<h1>RentMate map API is running</h1>
<p>This port is the <strong>backend API</strong>, not the RentMate website.</p>
<p>Open the app: <a href="http://localhost:8443">http://localhost:8443</a> → <strong>Find a flat</strong>.</p>
<h2>Quick checks</h2>
<ul>
<li><a href="/api/health">/api/health</a> — server + Supabase config</li>
<li><code>/api/listings?bbox=113.8,22.1,114.5,22.5&amp;status=available</code> — map pins (GeoJSON)</li>
<li><code>/api/geocode?q=Sha+Tin</code> — address search</li>
</ul>
<p>Supabase connected: ${Boolean(config.supabaseUrl)} · Service role (auto-seed): ${Boolean(config.supabaseServiceRoleKey)}</p>
</body></html>`)
})

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    supabase: Boolean(config.supabaseUrl),
    serviceRole: Boolean(config.supabaseServiceRoleKey),
    directPostgres: Boolean(config.databaseUrl),
    message: "Use http://localhost:8443 for the RentMate UI",
  })
})

app.use("/api/geocode", geocodeRouter)
app.use("/api/listings", listingsRouter)
app.use("/api/public", publicRouter)

app.listen(config.port, () => {
  console.log(`RentMate map API listening on http://localhost:${config.port}`)
  void tryAutoSeed()
})
