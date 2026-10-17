import { config } from "./config.js"
import { getSupabaseAdmin } from "./supabase-client.js"
import { runSeedListings } from "./scripts/seed-data.js"

export async function tryAutoSeed(): Promise<void> {
  if (!config.supabaseServiceRoleKey) {
    console.log(
      "Map API: no SUPABASE_SERVICE_ROLE_KEY — skip auto-seed (map reads still work with anon key)",
    )
    return
  }
  try {
    const sb = getSupabaseAdmin()
    const { count, error } = await sb
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .not("latitude", "is", null)

    if (error) {
      console.warn("Auto-seed check failed:", error.message)
      return
    }
    if ((count ?? 0) > 0) {
      console.log(`Map API: ${count} active geocoded listings in database`)
      return
    }
    console.log("Map API: no listings found — running demo seed…")
    await runSeedListings()
  } catch (e) {
    console.warn("Auto-seed skipped:", e)
  }
}
