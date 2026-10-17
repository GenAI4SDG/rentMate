import { createClient } from "@supabase/supabase-js"
import { config } from "../config.js"
import { describeEnvSetup } from "../env-hints.js"
import { assertServiceRoleKey } from "../validate-service-role-key.js"
import { buildFiftyHongKongListings } from "./hk-listings-50.js"

export const SEED_LANDLORD_EMAIL = "testing@rentmate.local"
export const SEED_LANDLORD_NAME = "testing"

const listings = buildFiftyHongKongListings()

export async function runSeedListings(): Promise<string> {
  const url = config.supabaseUrl
  const key = config.supabaseServiceRoleKey
  if (!url || !key) {
    throw new Error(
      `SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for seed.\n\n${describeEnvSetup(true)}`,
    )
  }
  assertServiceRoleKey(key)

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: list } = await admin.auth.admin.listUsers()
  let userId = list?.users?.find((u) => u.email === SEED_LANDLORD_EMAIL)?.id

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: SEED_LANDLORD_EMAIL,
      password: "rentmate-testing-demo",
      email_confirm: true,
      user_metadata: { full_name: SEED_LANDLORD_NAME },
    })
    if (error) throw error
    userId = data.user.id
  }

  await admin
    .from("profiles")
    .update({ role: "landlord", full_name: SEED_LANDLORD_NAME })
    .eq("id", userId)

  let inserted = 0
  for (const L of listings) {
    const { data: existing } = await admin
      .from("properties")
      .select("id")
      .eq("title_en", L.title)
      .maybeSingle()
    if (existing) continue

    const { error } = await admin.from("properties").insert({
      landlord_id: userId,
      title_en: L.title,
      district: L.district,
      address: L.address,
      monthly_rent: L.rent,
      bedrooms: L.beds,
      bathrooms: L.baths,
      area_sqft: L.sqft,
      latitude: L.lat,
      longitude: L.lng,
      property_type: "flat",
      status: "active",
    })
    if (error) throw error
    inserted++
  }

  console.log(`Inserted ${inserted} new listings (${listings.length} total in seed set).`)
  return userId
}
