/** Detect common mis-pasted Supabase keys before calling Auth Admin API. */
export function assertServiceRoleKey(key: string): void {
  const trimmed = key.trim()
  if (!trimmed) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is empty.")
  }

  if (trimmed.startsWith("sb_publishable_")) {
    throw new Error(
      [
        "SUPABASE_SERVICE_ROLE_KEY looks like a publishable key (sb_publishable_…).",
        "Auth Admin (seed, createUser) needs the secret service_role key, not publishable.",
        "",
        "In Supabase → Project Settings → API:",
        "  • Tab “Legacy anon, service_role API keys” → copy service_role (long eyJ… JWT), or",
        "  • Tab “API Keys” → copy the secret key (sb_secret_…), not publishable.",
        "",
        "Paste that into backend/server/.env.local as SUPABASE_SERVICE_ROLE_KEY only.",
      ].join("\n"),
    )
  }

  if (trimmed.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(
        Buffer.from(trimmed.split(".")[1] ?? "", "base64url").toString("utf8"),
      ) as { role?: string }
      if (payload.role === "anon") {
        throw new Error(
          [
            "SUPABASE_SERVICE_ROLE_KEY is the anon JWT (same as SUPABASE_ANON_KEY).",
            "Copy the separate service_role key from Supabase → Settings → API → Legacy keys.",
          ].join("\n"),
        )
      }
      if (payload.role && payload.role !== "service_role") {
        throw new Error(
          `SUPABASE_SERVICE_ROLE_KEY JWT role is "${payload.role}", expected service_role.`,
        )
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("SUPABASE_SERVICE_ROLE_KEY")) throw e
      /* non-JWT eyJ prefix — ignore decode errors */
    }
  }
}
