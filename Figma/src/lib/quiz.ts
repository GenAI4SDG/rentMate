// The demo questionnaire.
//
// THE SPLIT, as the owner defined it — this file is where it becomes visible:
//   SOFT  (scored, conflation is fine)      → sections "lifestyle" + "thinking"
//   BONDING (neither scored nor gated)      → section "bonding"
//   HARD  (gate before scoring, never scored) → section "nonneg"
//
// The hard block exists because the interesting claim is not "we ask 20
// questions" — everyone asks questions. It is that seven of the answers *exclude
// people outright*, and the app shows you who it hid and why.
//
// Question count: the owner set a short demo questionnaire. All seven
// eligibility filters are kept (they are the product's differentiator), and the
// soft block is compressed into composite questions instead — one tap answers
// several soft factors, or fixes several type axes. Nothing is dropped from the
// matcher's input: `answersToProfile` still produces every one of the six soft
// factors and a full four-letter type. See `values` / `letters` on QuizOption.
//
// Every hard question has an explicit "no preference" option. Skipping a filter
// is a legitimate choice, and an unanswered filter must never silently reject.
//
// The old Figma Q7 ("Same gender as me") used to conflate identity with
// preference — those are split apart on purpose (gender_identity vs
// gender_preference).

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
  /** Composite scale questions: one option can answer SEVERAL soft factors. */
  values?: Record<string, number>
  /** MBTI questions: the letter this option contributes. */
  letter?: string
  /** Composite MBTI questions: one option can fix SEVERAL axes at once. */
  letters?: Record<string, string>
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
  // The owner's demo boundary is a short questionnaire, so the six soft
  // lifestyle factors are elicited by TWO composite questions instead of six
  // separate ones. Every option still writes concrete 0..1 values for each of
  // its factors, so the matcher's input is unchanged — the score is still
  // factor-by-factor over the same six factors, never an archetype label.
  {
    id: "home_rhythm",
    section: "lifestyle",
    eyebrow: "Home rhythms",
    title: "What does an ordinary evening at home feel like?",
    hint: "Think about an ordinary weekday, not your ideal one.",
    kind: "scale",
    factor: "sleep_schedule",
    options: [
      {
        title: "Lights out early, flat silent",
        detail: "Before 10. Quiet is the whole point, and I like my own corner.",
        values: { sleep_schedule: 0, noise_preference: 0, personal_space_preference: 0 },
      },
      {
        title: "Early to bed, door open",
        detail: "Asleep by 11, but I like knowing there are people about.",
        values: { sleep_schedule: 0, noise_preference: 0.67, personal_space_preference: 0.67 },
      },
      {
        title: "Up late, headphones on",
        detail: "The night is mine, but I keep it to myself.",
        values: { sleep_schedule: 1, noise_preference: 0, personal_space_preference: 0.33 },
      },
      {
        title: "Up late, and loud about it",
        detail: "Music on past midnight, people in and out, barely a moment alone.",
        values: { sleep_schedule: 1, noise_preference: 1, personal_space_preference: 1 },
      },
    ],
  },
  {
    id: "shared_life",
    section: "lifestyle",
    eyebrow: "Shared space",
    title: "How does sharing a place actually go for you?",
    hint: "Be honest rather than aspirational.",
    kind: "scale",
    factor: "shared_space_habits",
    options: [
      {
        title: "Tidy, tracked, mostly to myself",
        detail: "Things go back where they live, and we split what each person used.",
        values: { shared_space_habits: 0, social_guest_preference: 0, bill_splitting_style: 0 },
      },
      {
        title: "Tidy, but the door is open",
        detail: "Everything has a place — and the flat is often full of people.",
        values: { shared_space_habits: 0, social_guest_preference: 0.67, bill_splitting_style: 0.33 },
      },
      {
        title: "Lived-in, and easy about it",
        detail: "Organised chaos, a friend over now and then, money evens out.",
        values: { shared_space_habits: 0.67, social_guest_preference: 0.33, bill_splitting_style: 0.67 },
      },
      {
        title: "One shared pot",
        detail: "We pool money, share the food, and the door stays open.",
        values: { shared_space_habits: 1, social_guest_preference: 1, bill_splitting_style: 1 },
      },
    ],
  },

  // --- how you think (soft, scored) ----------------------------------------
  // Two composite questions fix all four axes, so all sixteen types are still
  // reachable — the type is still worked out from behaviour, never asked for
  // as a four-letter code.
  {
    id: "mbti_energy",
    section: "thinking",
    eyebrow: "Social battery",
    title: "How do you recharge, and how do you plan?",
    hint: "Go with your first instinct.",
    kind: "mbti",
    factor: "mbti_EI",
    options: [
      {
        title: "Alone, with a plan",
        detail: "Quiet time on my own, and the itinerary is already booked.",
        letters: { mbti_EI: "I", mbti_SN: "S" },
      },
      {
        title: "Alone, following a hunch",
        detail: "Solitude refills the tank; the best bits are the unplanned ones.",
        letters: { mbti_EI: "I", mbti_SN: "N" },
      },
      {
        title: "With people, and a plan",
        detail: "Company gives me energy, and I like knowing what's happening.",
        letters: { mbti_EI: "E", mbti_SN: "S" },
      },
      {
        title: "With people, improvising",
        detail: "Being around people, and deciding more or less day by day.",
        letters: { mbti_EI: "E", mbti_SN: "N" },
      },
    ],
  },
  {
    id: "mbti_decide",
    section: "thinking",
    eyebrow: "Conflict and routine",
    title: "A flatmate's had a rough day — and what does your week look like?",
    hint: "Your genuine instinct, not the polite answer.",
    kind: "mbti",
    factor: "mbti_TF",
    options: [
      {
        title: "Solve it, and plan ahead",
        detail: "Help them fix what's wrong; the week is mapped out.",
        letters: { mbti_TF: "T", mbti_JP: "J" },
      },
      {
        title: "Solve it, as it comes",
        detail: "Work out the fix, then take the rest day by day.",
        letters: { mbti_TF: "T", mbti_JP: "P" },
      },
      {
        title: "Be there, and plan ahead",
        detail: "Just be with them first; I like knowing what's coming.",
        letters: { mbti_TF: "F", mbti_JP: "J" },
      },
      {
        title: "Be there, as it comes",
        detail: "The feeling comes first, and I keep my options open.",
        letters: { mbti_TF: "F", mbti_JP: "P" },
      },
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
    // Composite questions: one tap answers several soft factors, or fixes
    // several type axes. `values`/`letters` carry the full set, so a single
    // question can stand in for many without changing the matcher's input.
    if (option.values) {
      for (const [factor, v] of Object.entries(option.values)) {
        if (typeof v === "number") about_me[factor] = v
      }
    }
    if (option.letters) {
      for (const [axis, letter] of Object.entries(option.letters)) {
        letters[axis] = letter
      }
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
