// The app's data layer. Every call has a Supabase path and a local fallback, so
// the UI never depends on the network being configured.
//
// AUTH MODEL (2026-10-14): the account key is the user's EMAIL. There is no
// Supabase Auth sign-up, no password, no OTP. The only "auth" is the domain gate
// checked client-side (lib/institutions.ts). All other auth is pitch-deck only.
//
// The SCORE is computed locally (lib/matching.ts = CP.calculate_match.v2). Hooks
// and the NARRATIVE are pure functions of the profiles, computed here, so the
// demo's conversation starters work with no backend, no key and no model.

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
  /** True when this match is a real, persisted user (vs. a synthetic profile). */
  real?: boolean
  /** The other party's email when real. */
  email?: string
  /** Stable id for the conversation between the two emails. */
  conversationId?: string
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

/** A chat message. `id` is set for persisted (real) messages; absent for local. */
export type ChatMessage = {
  id?: string
  from: "them" | "me"
  text: string
  time: string
}

/** Stable conversation id for an unordered email pair. */
export function conversationIdFor(a: string, b: string): string {
  return [a, b].sort().join("::")
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
    real: candidate.real,
    email: candidate.email,
    conversationId: candidate.conversationId,
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

/** Map a persisted roommate_profiles row into a Candidate we can score/hook. */
function rowToCandidate(row: Record<string, unknown>, me: string): Candidate {
  const profile: Profile = {
    gender_identity: (row.gender_identity as Profile["gender_identity"]) ?? undefined,
    belief_system: (row.belief_system as string) ?? undefined,
    mbti_type: (row.mbti_type as string) ?? undefined,
    area: (row.campus_district as string) ?? "",
    target_areas: (row.target_areas as string[]) ?? [],
    budget_min: (row.budget_min as number) ?? undefined,
    budget_max: (row.budget_max as number) ?? undefined,
    about_me: (row.about_me as Profile["about_me"]) ?? {},
    looking_for: (row.looking_for as Profile["looking_for"]) ?? {},
  }
  const email = String(row.email)
  const budgetMin = row.budget_min as number | null
  const budgetMax = row.budget_max as number | null
  return {
    id: `real:${email}`,
    name: (row.display_name as string) || email.split("@")[0],
    school: (row.institution as string) || "",
    area: (row.campus_district as string) ?? "",
    budget: budgetMin && budgetMax ? `$${Math.round(budgetMin / 1000)}–${Math.round(budgetMax / 1000)}K` : "",
    image: "", // rendered as initials in the UI
    profile,
    real: true,
    email,
    conversationId: conversationIdFor(me, email),
  }
}

export type VerificationOutcome = { mode: "otp" | "demo" }

/**
 * Verification is DOMAIN-ONLY — by design.
 *
 * The Verify screen has already checked the address against the institution
 * allowlist (`validateInstitutionEmail`). We never send an email: no OTP, no
 * magic link. That keeps the flow instant, works for throwaway accounts, and
 * sidesteps Supabase's 2-emails/hour sender cap entirely. We persist NOTHING
 * about verification — the domain check is a pure client gate (the verification
 * table was dropped from the schema for exactly this reason).
 */
export async function requestVerification(_email: string): Promise<VerificationOutcome> {
  return { mode: "demo" }
}

/**
 * Persist the profile built from the quiz.
 *
 * The account key is the EMAIL — there is no auth.users row. With RLS disabled
 * for the demo, the anon client can upsert directly.
 *
 * `institutionName` is persisted separately from `campus_district`: the district
 * is the commute anchor the matcher computes on, while the school name is what
 * the other person actually reads on a match card. Dropping it left real
 * profiles rendering with an empty school (rowToCandidate falls back to "").
 */
export async function saveProfile(
  profile: Profile,
  email: string,
  institutionName?: string | null,
): Promise<void> {
  localStorage.setItem("rentmate.profile", JSON.stringify(profile))
  rememberAccount(email, institutionName ?? null)
  if (!supabase) return
  await supabase.from("roommate_profiles").upsert({
    email,
    institution: institutionName ?? null,
    about_me: profile.about_me ?? {},
    looking_for: profile.looking_for ?? {},
    gender_identity: profile.gender_identity ?? null,
    belief_system: profile.belief_system ?? null,
    mbti_type: profile.mbti_type ?? null,
    campus_district: profile.campus_district ?? null,
    target_areas: profile.target_areas ?? [],
    interests: profile.interests ?? [],
    budget_min: profile.budget_min ?? null,
    budget_max: profile.budget_max ?? null,
  })
}

/**
 * The matches. Scores locally (always — the deterministic contract), merges the
 * synthetic pool with any REAL persisted profiles (excluding self), and flags
 * which matches are real + which conversation they belong to.
 */
export async function getMatches(profile: Profile, email: string): Promise<MatchFeed> {
  const feed = localMatches(profile, email)
  if (!supabase) return feed

  try {
    const { data, error } = await supabase
      .from("roommate_profiles")
      .select("*")
      .neq("email", email)
    if (!error && data?.length) {
      for (const row of data as Record<string, unknown>[]) {
        const candidate = rowToCandidate(row, email)
        const reasons = filterReasons(profile, candidate.profile)
        if (reasons.length) {
          feed.hidden.push({ id: candidate.id, name: candidate.name, image: candidate.image, reasons })
          continue
        }
        const result = calculateMatch(profile, candidate.profile)
        feed.matches.push(toView(profile, candidate, result.score, result.status, result.factors))
      }
      feed.matches.sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    }
  } catch {
    // Real-profile merge is best-effort; the synthetic pool still works.
  }
  return feed
}

// ---------------------------------------------------------------------------
// REAL in-app chat (Supabase Realtime). Synthetic matches stay scripted/local.
// ---------------------------------------------------------------------------

/**
 * Send a message. Returns the client-generated id so the caller can append an
 * optimistic copy that the Realtime echo will dedupe against.
 */
export async function sendMessage(opts: {
  conversationId: string
  senderEmail: string
  text: string
}): Promise<string> {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `m_${Date.now()}_${Math.random().toString(36).slice(2)}`
  if (supabase) {
    await supabase
      .from("messages")
      .insert({
        id,
        conversation_id: opts.conversationId,
        sender_email: opts.senderEmail,
        body: opts.text,
      })
  }
  return id
}

/** Load a conversation's history, labelled relative to `myEmail`. */
export async function getHistory(
  conversationId: string,
  myEmail: string,
): Promise<ChatMessage[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    from: (r.sender_email as string) === myEmail ? "me" : "them",
    text: String(r.body),
    time: new Date(String(r.created_at)).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }))
}

/** Subscribe to live inserts for a conversation. Returns an unsubscribe fn. */
export function subscribeMessages(
  conversationId: string,
  myEmail: string,
  onMessage: (message: ChatMessage) => void,
): () => void {
  if (!supabase) return () => {}
  const client = supabase
  const channel = client
    .channel(`chat-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const r = payload.new as Record<string, unknown>
        onMessage({
          id: String(r.id),
          from: (r.sender_email as string) === myEmail ? "me" : "them",
          text: String(r.body),
          time: new Date(String(r.created_at)).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        })
      },
    )
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}

/** Moderation: report another user from a conversation. */
export async function reportMessage(opts: {
  reporterEmail: string
  reportedEmail: string
  conversationId: string
  reason: string
}): Promise<void> {
  if (!supabase) return
  await supabase
    .from("reports")
    .insert({
      reporter_email: opts.reporterEmail,
      reported_email: opts.reportedEmail,
      conversation_id: opts.conversationId,
      reason: opts.reason,
    })
}

/** "End a connection": block the other party. Hides the conversation for both. */
export async function blockUser(blockerEmail: string, blockedEmail: string): Promise<void> {
  if (!supabase) return
  await supabase
    .from("blocks")
    .insert({ blocker_email: blockerEmail, blocked_email: blockedEmail })
    .then(() => {}, () => {})
}

/** Emails the current user cannot chat with (they blocked, or were blocked). */
export async function getBlockedEmails(email: string): Promise<string[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from("blocks")
    .select("blocker_email, blocked_email")
    .or(`blocker_email.eq.${email},blocked_email.eq.${email}`)
  if (!data) return []
  return (data as Record<string, unknown>[]).map((r) =>
    (r.blocker_email as string) === email
      ? (r.blocked_email as string)
      : (r.blocker_email as string),
  )
}

// ---------------------------------------------------------------------------
// The account, reloaded. NO SESSIONS: there is no token, no cookie, no
// Supabase Auth. "Loading the account" means reading the one row keyed on the
// email the user typed, and nothing more. Anyone who types that same email
// gets the same account — that is the model, stated rather than implied.
// ---------------------------------------------------------------------------

/** Where the local mirror of the account lives. Write-only until now. */
const ACCOUNT_KEY = "rentmate.account"

export type StoredAccount = {
  email: string
  /** The institution NAME as persisted in `roommate_profiles.institution`. */
  institutionName: string | null
}

function readAccountCache(): StoredAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY)
    return raw ? (JSON.parse(raw) as StoredAccount) : null
  } catch {
    return null
  }
}

function writeAccountCache(account: StoredAccount): void {
  try {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account))
  } catch {
    // Private-mode / quota failures must not break the save path.
  }
}

/**
 * Rebuild a Profile from a `roommate_profiles` row.
 *
 * Deliberately NOT shared with `rowToCandidate`: that mapping reports `area`
 * as the campus district, which is what a *candidate's* commute note reads.
 * For the account owner we want the true target district, so `area` is
 * reconstructed from `target_areas[0]` — the same rule `answersToProfile`
 * uses when the profile is first built.
 */
function rowToProfile(row: Record<string, unknown>): Profile {
  const targetAreas = (row.target_areas as string[]) ?? []
  return {
    gender_identity: (row.gender_identity as Profile["gender_identity"]) ?? undefined,
    belief_system: (row.belief_system as string) ?? undefined,
    mbti_type: (row.mbti_type as string) ?? undefined,
    campus_district: (row.campus_district as string) ?? null,
    area: targetAreas[0] ?? null,
    target_areas: targetAreas,
    budget_min: (row.budget_min as number) ?? undefined,
    budget_max: (row.budget_max as number) ?? undefined,
    room_size: null,
    interests: (row.interests as string[]) ?? [],
    about_me: (row.about_me as Profile["about_me"]) ?? {},
    looking_for: (row.looking_for as Profile["looking_for"]) ?? {},
  }
}

export type LoadedAccount = {
  profile: Profile
  email: string
  institutionName: string | null
  /** Where the account came from — surfaced so the UI never overclaims. */
  source: "supabase" | "cache"
}

/**
 * Guarantee the derived fields the matcher and the hook engine read.
 *
 * `area` is not a column — it is `target_areas[0]`, the same rule
 * `answersToProfile` applies when the profile is first built. Deriving it
 * here means the Supabase path and the local-cache path cannot disagree: a
 * profile that was saved before this normalisation (or by hand) reloads with
 * the same `area` it would have had, instead of `undefined` quietly
 * degrading the commute notes in the hooks.
 */
function normalizeProfile(profile: Profile): Profile {
  const targetAreas = profile.target_areas ?? []
  return {
    ...profile,
    target_areas: targetAreas,
    area: profile.area ?? targetAreas[0] ?? null,
  }
}

/**
 * Load the account for an email: the persisted row when Supabase is
 * configured, else the local mirror. Returns null when the email has never
 * completed a quiz — which is the normal state for a first visit.
 */
export async function loadAccount(email: string): Promise<LoadedAccount | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("roommate_profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle()
      if (!error && data) {
        const account: StoredAccount = {
          email,
          institutionName: (data as Record<string, unknown>).institution as string | null,
        }
        writeAccountCache(account)
        return {
          profile: normalizeProfile(rowToProfile(data as Record<string, unknown>)),
          email,
          institutionName: account.institutionName,
          source: "supabase",
        }
      }
    } catch {
      // Fall through to the cache rather than blocking the app on the network.
    }
  }

  const cached = readAccountCache()
  if (cached && cached.email === email) {
    try {
      const raw = localStorage.getItem("rentmate.profile")
      if (raw) {
        return {
          profile: normalizeProfile(JSON.parse(raw) as Profile),
          email,
          institutionName: cached.institutionName,
          source: "cache",
        }
      }
    } catch {
      // Corrupt cache is treated as "no account".
    }
  }
  return null
}

/** Remember which email this browser was last using, for the mount reload. */
export function rememberAccount(email: string, institutionName: string | null): void {
  writeAccountCache({ email, institutionName })
}

/** The email this browser last used, or null on a first visit. */
export function storedEmail(): string | null {
  return readAccountCache()?.email ?? null
}

// ---------------------------------------------------------------------------
// Moderation, read back. A report that nobody can read is not moderation —
// it is a write to a table. These are what the "flag for admin review" flow
// actually needs to be true.
// ---------------------------------------------------------------------------

export type ReportRow = {
  id: string
  reporter_email: string
  reported_email: string
  conversation_id: string | null
  reason: string | null
  created_at: string
}

export type BlockRow = {
  id: string
  blocker_email: string
  blocked_email: string
  created_at: string
}

/** Every report, newest first — the admin review queue. */
export async function getReports(): Promise<ReportRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    reporter_email: String(r.reporter_email),
    reported_email: String(r.reported_email),
    conversation_id: r.conversation_id == null ? null : String(r.conversation_id),
    reason: r.reason == null ? null : String(r.reason),
    created_at: String(r.created_at),
  }))
}

/** Every block, newest first — so an admin can see ended connections too. */
export async function getBlocks(): Promise<BlockRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("blocks")
    .select("*")
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    blocker_email: String(r.blocker_email),
    blocked_email: String(r.blocked_email),
    created_at: String(r.created_at),
  }))
}
