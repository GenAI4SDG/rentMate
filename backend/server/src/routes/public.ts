import { Router } from "express"
import { config } from "../config.js"
import { getSupabaseAdmin } from "../supabase-client.js"

export const publicRouter = Router()

/** Demo landlord account used for hackathon seed (display name: testing). */
publicRouter.get("/demo-landlord", async (_req, res) => {
  if (!config.supabaseServiceRoleKey) {
    return res.status(503).json({
      error: "Server missing SUPABASE_SERVICE_ROLE_KEY",
      hint: "Add it to backend/server/.env.local and restart map API",
    })
  }
  try {
    const sb = getSupabaseAdmin()
    const { data: users } = await sb.auth.admin.listUsers()
    const match = users.users.find(
      (u) =>
        u.email === "testing@rentmate.local" ||
        u.user_metadata?.full_name === "testing",
    )
    if (!match) {
      return res.status(404).json({
        error: "Demo landlord not seeded yet",
        hint: "Run npm run seed:listings in backend/server",
      })
    }
    await sb
      .from("profiles")
      .update({ full_name: "testing", role: "landlord" })
      .eq("id", match.id)

    return res.json({
      id: match.id,
      displayName: "testing",
      email: match.email,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lookup failed"
    return res.status(500).json({ error: message })
  }
})
