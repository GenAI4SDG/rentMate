// The icebreaker engine.
//
// WHY THIS EXISTS: a ranked grid or a swipe deck is a poor way to sell an idea
// — the numbers do the talking and the numbers are the least interesting part.
// So the match surface leads with a *conversation hook*: one concrete thing two
// people actually have in common, phrased so you want to react to it
// ("wait, rlly?!" / "same!!"). Reacting IS the opener; the reply is cached, so
// the whole thing runs with no API and no model.
//
// EVERYTHING HERE IS DETERMINISTIC AND DERIVED. Hooks are built from real
// overlap — shared interests, the same target district, genuinely aligned
// lifestyle factors, shared MBTI axes — so a hook is never decoration. When
// there is no overlap, there is no hook, and the card says so.

import { calculateMatch, commuteMinutes, type Profile } from "./matching"

/** The shared vocabulary the interest question and the candidate pool both draw from. */
export const INTEREST_VOCAB = [
  "24-hour cha chaan teng",
  "chicken McNuggets at 2am",
  "Sunday hikes",
  "K-pop",
  "milk tea, less sugar",
  "second-hand bookshops",
  "night markets",
  "indie gigs",
  "bouldering",
  "cooking at home",
  "film photography",
  "street-food hunts",
  "badminton",
  "board games",
  "vintage markets",
  "swimming",
] as const

export type ReactionId = "wait" | "same" | "more" | "pass"

export type Reaction = {
  id: ReactionId
  label: string
  hint: string
}

/** The reaction row under every hook. `pass` sends nothing. */
export const REACTIONS: Reaction[] = [
  { id: "wait", label: "wait, rlly?!", hint: "ask them to go on" },
  { id: "same", label: "same!!", hint: "you feel the same" },
  { id: "more", label: "tell me more", hint: "they share a place story" },
  { id: "pass", label: "not for me", hint: "skip — nothing is sent" },
]

export type HookKind = "story" | "interest" | "area" | "lifestyle" | "mbti"

export type Hook = {
  id: string
  kind: HookKind
  /** The line on the card. Third person, about them — never about a score. */
  text: string
  /** What they say if you react "wait, rlly?!". */
  reply: string
}

/** The minimum needed to produce a cached reply — narrower than HookSubject. */
export type ReplySubject = {
  id: string
  name: string
  area: string
  /** Curated extras — present on the admin demo cast, absent on the generic pool. */
  place_story?: { area: string; headline: string; story: string }
  replies?: Partial<Record<ReactionId, string>>
}

/** Everything needed to build hooks for a candidate. */
export type HookSubject = ReplySubject & {
  profile: Profile
  likes?: string[]
}

/**
 * A short form of the name for in-line hooks. Chinese names (`Ka Ming Cheung`,
 * `Wing Yan Tsang`) read badly when cut to one syllable, so a short first token
 * takes two instead.
 */
const firstName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return name
  return parts[0].length < 3 ? parts.slice(0, 2).join(" ") : parts[0]
}

// --- lifestyle lines ---------------------------------------------------------
// Keyed by soft factor. The direction is chosen from the shared value, so the
// line describes where they actually sit, not merely that they agree.

const LIFESTYLE_LINES: Record<string, (name: string, shared: number) => string> = {
  sleep_schedule: (n, v) =>
    v < 0.5
      ? `You and ${n} both wind down early — lights out before 11.`
      : `You and ${n} are both night owls.`,
  shared_space_habits: (n, v) =>
    v < 0.5
      ? `You're both the tidy type — things go back where they live.`
      : `Neither you nor ${n} is precious about a bit of mess.`,
  social_guest_preference: (n, v) =>
    v < 0.5
      ? `Neither of you fills the flat with guests.`
      : `You both like a flat that people actually come to.`,
  noise_preference: (n, v) =>
    v < 0.5
      ? `You both want it quiet at home.`
      : `You both like a bit of noise around the place.`,
  personal_space_preference: (n, v) =>
    v < 0.5
      ? `You both need your own corner to retreat to.`
      : `You're both happy sharing most of the day.`,
  bill_splitting_style: (n, v) =>
    v < 0.5
      ? `You'd both track shared costs to the cent.`
      : `You'd both just throw money in a pot and not fuss.`,
}

const LIFESTYLE_REPLIES: Record<string, string> = {
  sleep_schedule: "Yeah — I'm useless past midnight, so it matters to me. What's your usual?",
  shared_space_habits: "I've lived with the other kind and it wore me down. You?",
  social_guest_preference: "I like hosting, but I like coming home to quiet too. Where do you sit?",
  noise_preference: "I can't work with a TV going. Small thing, big deal. You?",
  personal_space_preference: "I need an hour to myself or I get prickly. Same for you?",
  bill_splitting_style: "I've had the awkward spreadsheet conversation before. Rather avoid it. You?",
}

// --- MBTI lines --------------------------------------------------------------
// The four axes are inferred from behaviour in the quiz, so these describe
// behaviour rather than naming a type.

const MBTI_LINES: Record<string, string> = {
  E: "You both get your energy from being around people.",
  I: "You both recharge on your own, not in a crowd.",
  S: "You'd both rather have the plan confirmed before you go.",
  N: "You'd both rather improvise and see what happens.",
  T: "When something's off, you both go straight for the fix.",
  F: "You both lead with how someone's actually feeling.",
  J: "You both like the week mapped out in advance.",
  P: "You both like to keep your options open.",
}

const MBTI_REPLIES: Record<string, string> = {
  E: "I get restless on my own for too long. You?",
  I: "Big groups drain me. I need the quiet after.",
  S: "I like knowing the plan. Improvising stresses me out.",
  N: "I'd rather turn up and figure it out. You?",
  T: "I go straight to fixing it — sometimes that's not what people want.",
  F: "I'd rather they felt heard than fixed, honestly.",
  J: "I'm a calendar person. It's not for everyone.",
  P: "I keep weekends open on purpose.",
}

/** Shared MBTI axes, in canonical order. */
function sharedAxes(a: string | null | undefined, b: string | null | undefined): string[] {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== 4 || b.length !== 4) return []
  const A = a.toUpperCase()
  const B = b.toUpperCase()
  const out: string[] = []
  for (let i = 0; i < 4; i += 1) if (A[i] === B[i]) out.push(A[i])
  return out
}

// --- the builder -------------------------------------------------------------

/**
 * Build the hooks for one candidate, best first. Returns an empty array when
 * there is genuinely nothing shared — the card then says so rather than
 * inventing chemistry.
 */
export function buildHooks(me: Profile, them: HookSubject): Hook[] {
  const name = firstName(them.name)
  const hooks: Hook[] = []

  // 1. A curated place story outranks everything — it is the most human thing
  //    on the card, and it is only present on the admin demo cast.
  if (them.place_story) {
    hooks.push({
      id: "story",
      kind: "story",
      text: them.place_story.headline,
      reply: them.place_story.story,
    })
  }

  // 2. Shared interests. This is the owner's example hook.
  const mine = me.interests ?? []
  const theirs = them.likes ?? []
  const shared = theirs.filter((like) => mine.includes(like))
  if (shared.length) {
    const first = shared[0]
    hooks.push({
      id: `interest:${first}`,
      kind: "interest",
      text: `${name} also has a thing for ${first}${shared.length > 1 ? ` — and ${shared.length - 1} more you'd agree on` : ""}.`,
      reply: `Ha — yeah, ${first}. It's a small thing but it's the kind of small thing that matters when you live together. What's yours?`,
    })
  }

  // 3. Same target district, with the estimated door-to-campus time.
  const campus = me.campus_district
  const limit = me.looking_for?.max_commute_minutes ?? null
  const targets = new Set(
    [...(me.target_areas ?? []), me.area].filter(Boolean) as string[],
  )
  const sameArea = targets.has(them.area)
  const minutes = campus ? commuteMinutes(them.area, campus) : null
  if (sameArea) {
    hooks.push({
      id: `area:${them.area}`,
      kind: "area",
      text: `${name} is also looking in ${them.area}.`,
      reply: `I've been round ${them.area} a fair bit this year. Happy to swap notes on which streets are actually quiet.`,
    })
  } else if (minutes !== null && limit !== null && minutes <= limit) {
    hooks.push({
      id: `area:${them.area}`,
      kind: "area",
      text: `${them.area} is about ${minutes} min from your campus — and ${name} is already looking there.`,
      reply: `It's about ${minutes} min for me too, most days. Where else have you been looking?`,
    })
  }

  // 4. The genuinely aligned lifestyle factors.
  const { factors } = calculateMatch(me, them.profile)
  const ranked = Object.entries(factors)
    .filter(([key]) => key in LIFESTYLE_LINES)
    .sort((a, b) => b[1] - a[1])
  for (const [key, value] of ranked.slice(0, 2)) {
    if (value < 0.8) continue
    const mineV = me.about_me?.[key]
    const theirsV = them.profile.about_me?.[key]
    const sharedValue =
      typeof mineV === "number" && typeof theirsV === "number" ? (mineV + theirsV) / 2 : 0.5
    hooks.push({
      id: `lifestyle:${key}`,
      kind: "lifestyle",
      text: LIFESTYLE_LINES[key](name, sharedValue),
      reply: LIFESTYLE_REPLIES[key] ?? "It's the kind of thing I'd want in a flatmate too.",
    })
  }

  // 5. Shared MBTI axes, at most two so the card stays readable.
  const axes = sharedAxes(me.mbti_type, them.profile.mbti_type)
  for (const axis of axes.slice(0, 2)) {
    hooks.push({
      id: `mbti:${axis}`,
      kind: "mbti",
      text: MBTI_LINES[axis],
      reply: MBTI_REPLIES[axis] ?? "That's usually the thing people notice about me first.",
    })
  }

  return hooks
}

/** The cached reply to a reaction. No model, no network. */
export function replyFor(them: ReplySubject, reaction: ReactionId, hook: Hook | null): string {
  const curated = them.replies?.[reaction]
  if (curated) return curated
  switch (reaction) {
    case "wait":
      return hook?.reply ?? "It's the kind of thing I'd want in a flatmate too. What's yours?"
    case "same":
      return `Okay, that's a good sign. So — what are you actually looking for in a flat?`
    case "more":
      return (
        them.place_story?.story ??
        `Sure — I've been round ${them.area} a lot this year. Ask me anything about it.`
      )
    case "pass":
      return ""
  }
}

/** The label on the reaction button that produced a reply, for the chat bubble. */
export function reactionLabel(id: ReactionId): string {
  return REACTIONS.find((r) => r.id === id)?.label ?? id
}

// --- the narrative -----------------------------------------------------------
// Replaces the old "deterministic weighted score (72/100)" sentence. The score
// still exists — it just is not the headline, and it is shown as a similarity,
// never a measurement.

const NARRATIVE_FACTORS: Record<string, string> = {
  sleep_schedule: "when you sleep",
  shared_space_habits: "how you keep shared space",
  social_guest_preference: "how often you host",
  noise_preference: "the noise level you like",
  personal_space_preference: "how much solo time you need",
  bill_splitting_style: "how you split costs",
  mbti: "how you communicate",
}

/** A short, human, cached summary. Deterministic — same inputs, same words. */
export function cachedNarrative(
  them: HookSubject,
  factors: Record<string, number>,
): string {
  const name = firstName(them.name)
  const entries = Object.entries(factors).sort((a, b) => b[1] - a[1])
  if (!entries.length) {
    return `You and ${name} haven't answered enough of the same questions to say anything useful yet.`
  }
  const strong = entries.filter(([, v]) => v >= 0.8).slice(0, 2)
  const weakest = entries[entries.length - 1]

  const strengths = strong.length
    ? `You and ${name} line up on ${strong
        .map(([key]) => NARRATIVE_FACTORS[key] ?? key)
        .join(" and ")}.`
    : `You and ${name} are close on the basics but nothing stands out as a perfect match.`

  const friction =
    weakest[1] < 0.5
      ? ` The one thing worth talking about first: ${NARRATIVE_FACTORS[weakest[0]] ?? weakest[0]}.`
      : ` Nothing here reads as a real friction point.`

  return strengths + friction
}

/** A one-line "what to say first" prompt, derived from the top hook. */
export function openerPrompt(hook: Hook | null, them: ReplySubject): string {
  if (!hook) return `You two don't overlap much yet — try asking about their week.`
  switch (hook.kind) {
    case "interest":
      return `Lead with the shared thing. It's the easiest first message you'll ever send.`
    case "area":
      return `Ask which streets in ${them.area} they've already looked at.`
    case "story":
      return `Ask them for the rest of the story — they clearly like talking about it.`
    case "lifestyle":
      return `Say how you actually live, then ask if it matches.`
    case "mbti":
      return `Tell them whether that sounds like you. It's a fast way to find out.`
  }
}
