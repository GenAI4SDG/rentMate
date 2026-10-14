// The demo questionnaire.
//
// THE SPLIT, as the owner defined it — this file is where it becomes visible:
//   SOFT  (scored, conflation is fine)      → sections "lifestyle" + "thinking"
//   BONDING (neither scored nor gated)      → section "bonding"
//   HARD  (gate before scoring, never scored) → section "nonneg"
//
// The hard block exists because the interesting claim is not "we ask 20
// questions" — everyone asks questions. It is that six of the answers *exclude
// people outright*, and the app shows you who it hid and why.
//
// Every hard question has an explicit "no preference" option. Skipping a filter
// is a legitimate choice, and an unanswered filter must never silently reject.
//
// Q1–Q10 are the original thin-slice questions; Q11+ are the hard checks. The
// old Figma Q7 ("Same gender as me") used to conflate identity with preference —
// those are split apart on purpose (gender_identity vs gender_preference).

import { INTEREST_VOCAB } from "./hooks"
import { TARGET_AREA_OPTIONS, type GenderIdentity, type Profile } from "./matching"

export type QuizSection = "lifestyle" | "thinking" | "bonding" | "nonneg"

export const SECTIONS: Record<QuizSection, { label: string; blurb: string }> = {
  lifestyle: {
    label: "How you live",
    blurb: "The everyday stuff. These feed the score.",
  },
  thinking: {
    label: "How you think",
    blurb: "We work your type out from behaviour, not from a four-letter code.",
  },
  bonding: {
    label: "What you'd bond over",
    blurb: "Purely for the icebreaker. Never scored, never a filter.",
  },
  nonneg: {
    label: "What's non-negotiable",
    blurb: "These don't affect your score — they decide who you see at all.",
  },
}

export type QuizOption = {
  title: string
  detail?: string
  tone?: string
  /** Scale questions: the factor value, 0..1. */
  value?: number
  /** MBTI questions: the letter this option contributes. */
  letter?: string
  /** Gender identity. */
  identity?: GenderIdentity
  /** Gender preference. */
  anyGender?: boolean
  categories?: GenderIdentity[]
  /** Belief questions. */
  belief?: string
  /** True when the answerer does not want belief to be a filter. */
  anyBelief?: boolean
  /** Interest / area multi-selects. */
  tag?: string
  /** Commute tolerance, in minutes. `null` means "no limit". */
  minutes?: number | null
  /** Monthly budget band, HKD. `null` means "no ceiling". */
  budgetMin?: number
  budgetMax?: number | null
  /** Minimum room size, sq ft. `null` means "any". */
  sizeMin?: number | null
  /** Smoking rule for the flat, plus the answerer's own status. */
  smoking?: "required_non_smoking" | "no_preference"
  /** 1 = the answerer does not smoke, 0 = they do. */
  selfSmoking?: number
}

export type QuizQuestion = {
  id: string
  section: QuizSection
  eyebrow: string
  title: string
  hint: string
  /** "scale" | "mbti" | "multi" | "choice" — drives how the UI renders it. */
  kind: "scale" | "mbti" | "multi" | "choice"
  /** The Profile key this question writes to. */
  factor: string
  /** Multi-select questions only. */
  max?: number
  /** Optional questions may be skipped. */
  optional?: boolean
  options: QuizOption[]
}

export const QUIZ: QuizQuestion[] = [
  // --- how you live (soft, scored) -----------------------------------------
  {
    id: "sleep",
    section: "lifestyle",
    eyebrow: "Home rhythms",
    title: "When does your day usually wind down?",
    hint: "Think about an ordinary weekday, not your ideal one.",
    kind: "scale",
    factor: "sleep_schedule",
    options: [
      { title: "Early — lights out before 10", detail: "Mornings are my best hours.", value: 0 },
      { title: "Around 11", detail: "A steady, mid-paced evening.", value: 0.33 },
      { title: "After midnight", detail: "I come alive once it's quiet.", value: 0.67 },
      { title: "It changes every day", detail: "No two nights look the same.", value: 1 },
    ],
  },
  {
    id: "shared_space",
    section: "lifestyle",
    eyebrow: "Shared space",
    title: "How do shared spaces usually end up?",
    hint: "Be honest rather than aspirational.",
    kind: "scale",
    factor: "shared_space_habits",
    options: [
      { title: "Tidy, reset daily", detail: "Things go back where they live.", value: 0 },
      { title: "A weekly reset", detail: "Lived-in, but under control.", value: 0.33 },
      { title: "Organised chaos", detail: "I know where everything is.", value: 0.67 },
      { title: "I tidy when it bothers me", detail: "Low maintenance by default.", value: 1 },
    ],
  },
  {
    id: "guests",
    section: "lifestyle",
    eyebrow: "Social energy",
    title: "How often do you have people over?",
    hint: "Choose what a normal month looks like.",
    kind: "scale",
    factor: "social_guest_preference",
    options: [
      { title: "Rarely", detail: "Home is where I recharge alone.", value: 0 },
      { title: "Now and then", detail: "A friend over for dinner.", value: 0.33 },
      { title: "Most weekends", detail: "I like a full, social flat.", value: 0.67 },
      { title: "The door is basically open", detail: "People come and go.", value: 1 },
    ],
  },
  {
    id: "noise",
    section: "lifestyle",
    eyebrow: "Atmosphere",
    title: "What does your ideal home sound like?",
    hint: "There is no right answer here.",
    kind: "scale",
    factor: "noise_preference",
    options: [
      { title: "Almost silent", detail: "Quiet is the whole point.", value: 0 },
      { title: "A quiet hum", detail: "Background music, low voices.", value: 0.33 },
      { title: "Lively", detail: "Music on, conversation going.", value: 0.67 },
      { title: "Always something on", detail: "Silence feels strange to me.", value: 1 },
    ],
  },
  {
    id: "personal_space",
    section: "lifestyle",
    eyebrow: "Personal space",
    title: "How much time to yourself do you need?",
    hint: "Per day, roughly.",
    kind: "scale",
    factor: "personal_space_preference",
    options: [
      { title: "A lot — I need my own corner", detail: "Solo time is non-negotiable.", value: 0 },
      { title: "A decent amount", detail: "An hour or two to reset.", value: 0.33 },
      { title: "Not much", detail: "I'm happy sharing most of the day.", value: 0.67 },
      { title: "Almost none", detail: "I'd rather be around people.", value: 1 },
    ],
  },
  {
    id: "bills",
    section: "lifestyle",
    eyebrow: "Shared costs",
    title: "How should household bills work?",
    hint: "Groceries, utilities, the small stuff.",
    kind: "scale",
    factor: "bill_splitting_style",
    options: [
      { title: "Tracked to the cent", detail: "Split exactly what each person used.", value: 0 },
      { title: "Roughly even", detail: "No spreadsheet needed.", value: 0.33 },
      { title: "Whoever's around pays", detail: "It evens out eventually.", value: 0.67 },
      { title: "One shared pot", detail: "We pool money and share everything.", value: 1 },
    ],
  },

  // --- how you think (soft, scored) ----------------------------------------
  {
    id: "mbti_ei",
    section: "thinking",
    eyebrow: "Social battery",
    title: "After a long week, what actually recharges you?",
    hint: "Go with your first instinct.",
    kind: "mbti",
    factor: "mbti_EI",
    options: [
      { title: "Quiet time on my own", detail: "Solitude refills the tank.", letter: "I" },
      { title: "Being around people", detail: "Company gives me energy.", letter: "E" },
    ],
  },
  {
    id: "mbti_sn",
    section: "thinking",
    eyebrow: "How you think",
    title: "Planning a trip, you tend to…",
    hint: "Pick the one that sounds more like you.",
    kind: "mbti",
    factor: "mbti_SN",
    options: [
      { title: "Trust the details and the plan", detail: "Booked, mapped, confirmed.", letter: "S" },
      { title: "Follow a hunch and improvise", detail: "The best bits are unplanned.", letter: "N" },
    ],
  },
  {
    id: "mbti_tf",
    section: "thinking",
    eyebrow: "Conflict style",
    title: "A flatmate's had a rough day. Your first move?",
    hint: "Your genuine instinct, not the polite answer.",
    kind: "mbti",
    factor: "mbti_TF",
    options: [
      { title: "Help them work out a fix", detail: "Solve the thing that's wrong.", letter: "T" },
      { title: "Just be there for them", detail: "The feeling comes first.", letter: "F" },
    ],
  },
  {
    id: "mbti_jp",
    section: "thinking",
    eyebrow: "Daily routine",
    title: "Your week usually looks…",
    hint: "Think about how it really goes.",
    kind: "mbti",
    factor: "mbti_JP",
    options: [
      { title: "Planned in advance", detail: "I like knowing what's coming.", letter: "J" },
      { title: "Decided day by day", detail: "I keep my options open.", letter: "P" },
    ],
  },

  // --- what you'd bond over (neither scored nor gated) ---------------------
  {
    id: "interests",
    section: "bonding",
    eyebrow: "The fun part",
    title: "What would you happily talk about for an hour?",
    hint: "Pick up to four. This is only used to find things you have in common.",
    kind: "multi",
    factor: "interests",
    max: 4,
    options: INTEREST_VOCAB.map((tag) => ({ title: tag, tag })),
  },

  // --- non-negotiables (hard gate) -----------------------------------------
  {
    id: "gender_identity",
    section: "nonneg",
    eyebrow: "About you",
    title: "How do you describe yourself?",
    hint: "Optional and private — it is never shown on your profile.",
    kind: "choice",
    factor: "gender_identity",
    optional: true,
    options: [
      { title: "Woman", identity: "woman" },
      { title: "Man", identity: "man" },
      { title: "Non-binary", identity: "nonbinary" },
      { title: "Prefer not to say", identity: "prefer_not_to_say" },
    ],
  },
  {
    id: "gender_preference",
    section: "nonneg",
    eyebrow: "Who you'd live with",
    title: "Who would you feel comfortable sharing a home with?",
    hint: "A hard filter — it decides who you see, and never affects your score.",
    kind: "choice",
    factor: "gender_preference",
    options: [
      { title: "Anyone", detail: "Compatibility matters most.", anyGender: true },
      { title: "Women only", categories: ["woman"] },
      { title: "Men only", categories: ["man"] },
      { title: "Non-binary / other", categories: ["nonbinary"] },
    ],
  },
  {
    id: "belief_system",
    section: "nonneg",
    eyebrow: "Belief system",
    title: "Does a belief system play a part in your daily life?",
    hint: "Optional and private, like the question above.",
    kind: "choice",
    factor: "belief_system",
    optional: true,
    options: [
      { title: "No religion", belief: "no religion" },
      { title: "Christianity", belief: "christianity" },
      { title: "Buddhism", belief: "buddhism" },
      { title: "Islam", belief: "islam" },
      { title: "Hinduism", belief: "hinduism" },
      { title: "Something else", belief: "other" },
      { title: "Prefer not to say", belief: "prefer_not_to_say" },
    ],
  },
  {
    id: "belief_preference",
    section: "nonneg",
    eyebrow: "Belief system",
    title: "Should your flatmate share it?",
    hint: "Most people say no. If you say yes, we only show you people who match.",
    kind: "choice",
    factor: "belief_preference",
    options: [
      { title: "No — it isn't something I filter on", detail: "Recommended.", anyBelief: true },
      { title: "Yes — I'd rather live with someone who shares mine" },
    ],
  },
  {
    id: "target_areas",
    section: "nonneg",
    eyebrow: "Where you'd live",
    title: "Which areas would you actually consider?",
    hint: "Pick as many as you like. We use your campus to estimate the commute.",
    kind: "multi",
    factor: "target_areas",
    max: 6,
    options: TARGET_AREA_OPTIONS.map((tag) => ({ title: tag, tag })),
  },
  {
    id: "max_commute",
    section: "nonneg",
    eyebrow: "The commute",
    title: "How long is too long to get to campus?",
    hint: "We estimate this from district to district — it is a guide, not a journey planner.",
    kind: "choice",
    factor: "max_commute",
    options: [
      { title: "Up to 20 minutes", detail: "I want to walk it.", minutes: 20 },
      { title: "Up to 30 minutes", detail: "One short hop.", minutes: 30 },
      { title: "Up to 45 minutes", minutes: 45 },
      { title: "Up to an hour", detail: "The usual benchmark.", minutes: 60 },
      { title: "Up to 90 minutes", detail: "I'll go anywhere on the line.", minutes: 90 },
      { title: "No limit", detail: "Show me everything.", minutes: null },
    ],
  },
  {
    id: "budget",
    section: "nonneg",
    eyebrow: "Budget",
    title: "What can you pay each month?",
    hint: "Your ceiling is a hard filter — we never show you somewhere you can't afford.",
    kind: "choice",
    factor: "budget",
    options: [
      { title: "Under $5,000", budgetMin: 0, budgetMax: 5000 },
      { title: "$5,000 – $7,000", budgetMin: 5000, budgetMax: 7000 },
      { title: "$7,000 – $9,000", budgetMin: 7000, budgetMax: 9000 },
      { title: "$9,000 – $12,000", budgetMin: 9000, budgetMax: 12000 },
      { title: "$12,000 or more", budgetMin: 12000, budgetMax: null },
    ],
  },
  {
    id: "room_size",
    section: "nonneg",
    eyebrow: "Room size",
    title: "How small is too small?",
    hint: "A hard filter, so nobody wastes a viewing on a room they'd never take.",
    kind: "choice",
    factor: "room_size",
    options: [
      { title: "Any size — I'm flexible", sizeMin: null },
      { title: "At least 60 sq ft", sizeMin: 60 },
      { title: "At least 100 sq ft", sizeMin: 100 },
      { title: "At least 150 sq ft", sizeMin: 150 },
    ],
  },
  {
    id: "smoking",
    section: "nonneg",
    eyebrow: "Smoking",
    title: "Where do you stand on smoking at home?",
    hint: "One answer covers both your own status and the rule you want. Hard filter.",
    kind: "choice",
    factor: "smoking",
    options: [
      {
        title: "I don't smoke, and the flat must be smoke-free",
        smoking: "required_non_smoking",
        selfSmoking: 1,
      },
      {
        title: "I don't smoke, but I don't mind",
        smoking: "no_preference",
        selfSmoking: 1,
      },
      { title: "I smoke", smoking: "no_preference", selfSmoking: 0 },
    ],
  },
]

export type ProfileOptions = {
  /** From the verified institution — the anchor for every commute estimate. */
  campusDistrict?: string | null
}

/**
 * Turn the raw answer indices into a Profile the matcher understands.
 * Single-select questions contribute one index; multi-select questions
 * contribute an array of indices.
 */
export function answersToProfile(
  answers: (number | number[] | undefined)[],
  options: ProfileOptions = {},
): Profile {
  const about_me: Record<string, number> = {}
  const looking_for: Profile["looking_for"] = {}
  const letters: Record<string, string> = {}
  const multi: Record<string, string[]> = {}
  const picked: Record<string, QuizOption> = {}

  QUIZ.forEach((q, i) => {
    const choice = answers[i]
    if (choice === undefined) return
    const indices = Array.isArray(choice) ? choice : [choice]
    const chosen = indices
      .map((j) => q.options[j])
      .filter((o): o is QuizOption => Boolean(o))
    if (!chosen.length) return

    if (q.kind === "multi") {
      multi[q.factor] = chosen.map((o) => o.tag).filter((t): t is string => Boolean(t))
      return
    }

    const option = chosen[0]
    picked[q.factor] = option
    if (q.kind === "scale" && typeof option.value === "number") {
      about_me[q.factor] = option.value
    } else if (q.kind === "mbti" && option.letter) {
      letters[q.factor] = option.letter
    }
  })

  // Gender preference (identity is read from `picked` below).
  const genderPref = picked.gender_preference
  if (genderPref?.anyGender) looking_for.any_gender = true
  else if (genderPref?.categories) {
    looking_for.roommate_gender_categories = genderPref.categories
  }

  // Belief: the identity is the answer to belief_system; the requirement is the
  // answer to belief_preference. A "yes" copies whichever belief was chosen.
  const beliefSystem = picked.belief_system?.belief ?? null
  const beliefPref = picked.belief_preference
  if (beliefPref?.anyBelief) {
    looking_for.any_belief = true
  } else if (beliefPref && beliefSystem && beliefSystem !== "prefer_not_to_say") {
    looking_for.belief_systems = [beliefSystem]
  } else {
    looking_for.any_belief = true // unstated preference must never exclude
  }

  const commute = picked.max_commute
  if (commute) looking_for.max_commute_minutes = commute.minutes ?? null

  const budget = picked.budget
  const budgetMin = budget?.budgetMin ?? null
  const budgetMax = budget?.budgetMax ?? null

  const size = picked.room_size
  if (size) looking_for.room_size_min = size.sizeMin ?? null

  const smoking = picked.smoking
  looking_for.smoking_rule = smoking?.smoking ?? "no_preference"
  // The answerer's own status, so the gate works in both directions.
  about_me.smoking_status = smoking?.selfSmoking ?? 1

  const mbti =
    letters.mbti_EI && letters.mbti_SN && letters.mbti_TF && letters.mbti_JP
      ? `${letters.mbti_EI}${letters.mbti_SN}${letters.mbti_TF}${letters.mbti_JP}`
      : null

  const targetAreas = multi.target_areas ?? []

  return {
    about_me,
    looking_for,
    gender_identity: picked.gender_identity?.identity ?? null,
    belief_system: beliefSystem,
    mbti_type: mbti,
    campus_district: options.campusDistrict ?? null,
    target_areas: targetAreas,
    area: targetAreas[0] ?? null,
    budget_min: budgetMin,
    budget_max: budgetMax,
    room_size: null,
    interests: multi.interests ?? [],
  }
}

/** The questions in one section, in order — used by the progress UI. */
export function sectionOf(index: number): QuizSection {
  return QUIZ[index]?.section ?? "lifestyle"
}
