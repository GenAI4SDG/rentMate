import { Router } from "express"
import { requireUser, type AuthedRequest } from "../auth.js"
import { mapDbStatusToApi } from "../lib/bbox.js"
import { getSupabaseAdmin } from "../supabase-client.js"

export const landlordRouter = Router()

landlordRouter.use(requireUser)

/** Mark the signed-in user as a landlord (profiles.role) and return their profile. */
landlordRouter.post("/me", async (req, res) => {
  const { userId, userEmail } = req as AuthedRequest
  const sb = getSupabaseAdmin()
  const fullName =
    typeof req.body?.displayName === "string" ? req.body.displayName.trim() : ""

  const patch: Record<string, unknown> = { role: "landlord" }
  if (fullName) patch.full_name = fullName

  const { error } = await sb.from("profiles").update(patch).eq("id", userId)
  if (error) return res.status(500).json({ error: error.message })

  const { data } = await sb
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .maybeSingle()

  return res.json({
    id: userId,
    email: userEmail,
    displayName: data?.full_name || fullName || userEmail.split("@")[0],
    role: data?.role ?? "landlord",
  })
})

/** All listings owned by the signed-in landlord (any status). */
landlordRouter.get("/listings", async (req, res) => {
  const { userId } = req as AuthedRequest
  const { data, error } = await getSupabaseAdmin()
    .from("properties")
    .select(
      "id, title_en, address, district, monthly_rent, bedrooms, bathrooms, status, created_at",
    )
    .eq("landlord_id", userId)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) return res.status(500).json({ error: error.message })
  return res.json({
    listings: (data ?? []).map((r) => ({
      id: r.id as string,
      title: r.title_en as string,
      address: r.address as string,
      district: r.district as string,
      price: Number(r.monthly_rent),
      bedrooms: r.bedrooms as number,
      bathrooms: r.bathrooms as number,
      status: mapDbStatusToApi(r.status as string),
      createdAt: r.created_at as string,
    })),
  })
})
