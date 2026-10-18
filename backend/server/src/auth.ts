import type { NextFunction, Request, Response } from "express"
import { config } from "./config.js"
import { getSupabaseAdmin } from "./supabase-client.js"

export type AuthedRequest = Request & { userId: string; userEmail: string }

/**
 * Verifies the Supabase Auth JWT sent as `Authorization: Bearer <access_token>`.
 * Write endpoints use the verified user id — never an id supplied by the client.
 */
export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : ""
  if (!token) {
    return res.status(401).json({ error: "Sign in required" })
  }
  if (!config.supabaseServiceRoleKey) {
    return res.status(503).json({
      error: "Server missing SUPABASE_SERVICE_ROLE_KEY — writes are disabled",
    })
  }
  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token)
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired session" })
    }
    ;(req as AuthedRequest).userId = data.user.id
    ;(req as AuthedRequest).userEmail = data.user.email ?? ""
    return next()
  } catch {
    return res.status(401).json({ error: "Could not verify session" })
  }
}
