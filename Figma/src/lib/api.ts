// The app's data layer. Every call has a Supabase path and a local fallback, so
// the UI never depends on the network being configured.
//
// The SCORE may come from Supabase (the Edge Function runs the same contract in
// SQL). The HOOKS and the NARRATIVE never do — they are pure functions of the
// profiles, computed here, so the demo's conversation starters work with no
// backend, no key and no model.

import { supabase, backendMode } from "./supabase"
import { calculateMatch, filterReasons, type GateFinding, type Profile } from "./matching"
import { buildHooks, cachedNarrative, type Hook } from "./hooks"
import { poolFor, type Candidate } from "./demoData"

export { backendMode }

export type MatchView = {
  id: string
  name: string
  school: string
  area: string
  budget: string
  image: string
  tagline?: string
  score: number | null
  status: string
  narrative: string | null
  factors: Record<string, number>
  /** Conversation starters, best first. Empty when there is genuinely no overlap. */
  hooks: Hook[]
  likes?: string[]
  place_story?: Candidate["place_story"]
  replies?: Candidate["replies"]
  thread?: Candidate["thread"]
}

export type HiddenMatch = {
  id: string
  name: string
  image: string
  reasons: GateFinding[]
}

export type MatchFeed = {
  matches: MatchView[]
  /** People the hard gate removed, with the reason — shown, not silently dropped. */
  hidden: HiddenMatch[]
  /** True when the curated demo cast is in play. */
  curated: boolean
}

/** Build the view for one candidate from a score result. Hooks are always local. */
function toView(
  me: Profile,
  candidate: Candidate,
  score: number | null,
  status: string,
  factors: Record<string, number>,
): MatchView {
  return {
    id: candidate.id,
    name: candidate.name,
    school: candidate.school,
    area: candidate.area,
    budget: candidate.budget,
    image: candidate.image,
    tagline: candidate.tagline,
    score,
    status,
    narrative: status === "scored" ? cachedNarrative(candidate, factors) : null,
    factors,
    hooks: buildHooks(me, candidate),
    likes: candidate.likes,
    place_story: candidate.place_story,
    replies: candidate.replies,
    thread: candidate.thread,
  }
}

/** Local scoring: hard filter, then the deterministic score, then the hooks. */
function localMatches(profile: Profile, email: string): MatchFeed {
  const pool = poolFor(email)
  const matches: MatchView[] = []
  const hidden: HiddenMatch[] = []

  for (const candidate of pool) {
    const reasons = filterReasons(profile, candidate.profile)
    if (reasons.length) {
      hidden.push({ id: candidate.id, name: candidate.name, image: candidate.image, reasons })
      continue
    }
    const result = calculateMatch(profile, candidate.profile)
    matches.push(toView(profile, candidate, result.score, result.status, result.factors))
  }

  matches.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  return { matches, hidden, curated: pool.some((c) => Boolean(c.place_story)) }
}

export type VerificationOutcome = { mode: "otp" | "demo" }

/**
 * Verification is DOMAIN-ONLY — by design.
 *
 * The Verify screen has already checked the address against the institution
 * allowlist (`validateInstitutionEmail`). We never send an email: no OTP, no
 * magic link. That keeps the flow instant, works for throwaway accounts, and
 * sidesteps Supabase's 2-emails/hour sender cap entirely. Supabase is still used
 * for the backend *score* (Edge Function), never for sign-in here.
 */
export async function requestVerification(_email: string): Promise<VerificationOutcome> {
  return { mode: "demo" }
}

/** Persist the profile built from the quiz. */
export async function saveProfile(profile: Profile): Promise<void> {
  if (!supabase) {
    localStorage.setItem("rentmate.profile", JSON.stringify(profile))
    return
  }
  const { data } = await supabase.auth.getUser()
  if (!data.user) return
  await supabase.from("roommate_profiles").upsert({
    user_id: data.user.id,
    about_me: profile.about_me ?? {},
    looking_for: profile.looking_for ?? {},
    gender_identity: profile.gender_identity ?? null,
    belief_system: profile.belief_system ?? null,
    mbti_type: profile.mbti_type ?? null,
    campus_district: profile.campus_district ?? null,
    target_areas: profile.target_areas ?? [],
    budget_min: profile.budget_min ?? null,
    budget_max: profile.budget_max ?? null,
    interests: profile.interests ?? [],
  })
}

/**
 * The matches. Prefers the Edge Function for the *score*; falls back to local
 * scoring on any failure. Hooks and the hidden list are computed locally either
 * way, so the icebreakers never depend on the backend being up.
 */
export async function getMatches(profile: Profile, email: string): Promise<MatchFeed> {
  const fallback = localMatches(profile, email)
  if (!supabase) return fallback

  try {
    const { data, error } = await supabase.functions.invoke("compatibility", {
      body: {
        profile,
        candidates: fallback.matches.map((m) => {
          const candidate = poolFor(email).find((c) => c.id === m.id)
          return {
            id: m.id,
            name: m.name,
            school: m.school,
            area: m.area,
            budget: m.budget,
            profile: candidate?.profile ?? {},
          }
        }),
      },
    })
    if (error || !data?.matches?.length) return fallback

    const byId = new Map(fallback.matches.map((m) => [m.id, m]))
    const merged = (data.matches as Array<Record<string, unknown>>).flatMap((row) => {
      const base = byId.get(String(row.id))
      if (!base) return []
      const score = (row.score as number | null) ?? null
      const status = String(row.status ?? base.status)
      const factors = (row.factors as Record<string, number>) ?? base.factors
      const candidate = poolFor(email).find((c) => c.id === base.id)
      return [
        {
          ...base,
          score,
          status,
          factors,
          // Deliberately local: the cached narrative, not the model's.
          narrative:
            status === "scored" && candidate
              ? cachedNarrative(candidate, factors)
              : base.narrative,
        },
      ]
    })
    if (!merged.length) return fallback
    merged.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    return { ...fallback, matches: merged }
  } catch {
    return fallback
  }
}
