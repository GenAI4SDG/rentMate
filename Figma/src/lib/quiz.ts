// The demo questionnaire.
//
// THE SPLIT, as the owner defined it — this file is where it becomes visible:
//   SOFT  (scored, conflation is fine)      → sections "lifestyle" + "thinking"
//   BONDING (neither scored nor gated)      → section "bonding"
//   HARD  (gate before scoring, never scored) → section "nonneg"
//   DISPLAY (shown on the profile, never scored, never gated) → section "you"
//
// The hard block exists because the interesting claim is not "we ask 20
// questions" — everyone asks questions. It is that several of the answers
// *exclude people outright*, and the app shows you who it hid and why.
//
// Question count: the owner set a short demo questionnaire. All the eligibility
// filters are kept (they are the product's differentiator), and the soft block
// is compressed into composite questions instead — one tap answers several soft
// factors, or fixes several type axes. Nothing is dropped from the matcher's
// input: `answersToProfile` still produces every one of the six soft factors
// and a full four-letter type. See `values` / `letters` on QuizOption.
//
// Every hard question has an explicit "no preference" option. Skipping a filter
// is a legitimate choice, and an unanswered filter must never silently reject.
//
// The old Figma Q7 ("Same gender as me") used to conflate identity with
// preference — those are split apart on purpose (gender_identity vs
// gender_preference), and since 14 Oct the two halves sit on the SAME page,
// because they are the same topic. Same for the belief pair.
//
// NOT HARD ANYMORE: flat size. It used to block people outright. It is now a
// preference — you get told when a suggested home is outside your range, and
// nobody is hidden because of it. See `flatSizeWarning` in lib/matching.ts.

import { INTEREST_VOCAB } from "./hooks"
import { MUST_HAVE_OPTIONS } from "./listings"
import { TARGET_AREA_OPTIONS, type GenderIdentity, type Profile } from "./matching"

export type QuizSection = "you" | "lifestyle" | "thinking" | "bonding" | "nonneg"

export const SECTIONS: Record<QuizSection, { label: string; blurb: string }> = {
  you: {
    label: "About you",
    blurb: "Two basics, so people know who they're talking to. Never scored.",
  },
  lifestyle: {
    label: "How you live",
    blurb: "The everyday stuff. These shape who you get on with.",
  },
  thinking: {
    label: "How you think",
    blurb: "We work your type out from behaviour, not from a four-letter code.",
  },
  bonding: {
    label: "What you'd bond over",
    blurb: "Purely for the icebreaker. Never a filter.",
  },
  nonneg: {
    label: "What's non-negotiable",
    blurb: "These decide who you see at all.",
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
  /** Interest / area / must-have multi-selects. */
  tag?: string
  /** Commute tolerance, in minutes. `null` means "no limit". */
  minutes?: number | null
  /** Monthly budget band, HKD. `null` means "no ceiling". */
  budgetMin?: number
  budgetMax?: number | null
  /** Minimum whole-flat size, sq ft. `null` means "any". */
  sizeMin?: number | null
  /** How many other people you'd share with. Drives the household budget. */
  roommates?: number
  /** How often you cook at home. Unscored — an icebreaker and a home filter. */
  cooks?: "every day" | "often" | "rarely" | "never"
  /** Smoking rule for the flat, plus the answerer's own status. */
  smoking?: "required_non_smoking" | "no_preference"
  /** 1 = the answerer does not smoke, 0 = they do. */
  selfSmoking?: number
  /** Year of study, as displayed on the profile. */
  studyYear?: string
}

export type QuizQuestion = {
  id: string
  section: QuizSection
  eyebrow: string
  title: string
  hint: string
  /** "scale" | "mbti" | "multi" | "choice" | "text" — drives how the UI renders. */
  kind: "scale" | "mbti" | "multi" | "choice" | "text"
  /** The Profile key this question writes to. */
  factor: string
  /** Multi-select questions only. */
  max?: number
  /** Optional questions may be skipped. */
  optional?: boolean
  /**
   * Consecutive questions sharing a `group` render on ONE page — used to put
   * the two gender questions together and the two belief questions together.
   */
  group?: string
  /** Free-text questions only: placeholder and length cap. */
  placeholder?: string
  maxLength?: number
  options: QuizOption[]
}

/** One answer: an option index, a set of indices, or free text. */
export type Answer = number | number[] | string | undefined

export const QUIZ: QuizQuestion[] = [
  // --- about you (neither scored nor gated) --------------------------------
  // Added 14 Oct, second pass. The owner's question was "why is info like study
  // year and major available in the profile but not in the quiz?" — and the
  // answer was that it was NOT available: the curated demo cast bakes
  // "Year 2 · Sociology" into its `school` string, so the cast *looked* like it
  // carried these and the owner's own profile carried nothing. Two real
  // questions, two real Profile fields, two real columns. They are display
  // only — no factor, no gate, and the matcher never reads them.
  {
    id: "study_year",
    section: "you",
    eyebrow: "About you",
    title: "Which year are you in?",
    hint: "Shown on your profile. It never filters anybody out.",
    kind: "choice",
    factor: "study_year",
    group: "you",
    options: [
      { title: "Year 1", studyYear: "Year 1" },
      { title: "Year 2", studyYear: "Year 2" },
      { title: "Year 3", studyYear: "Year 3" },
      { title: "Year 4 or above", studyYear: "Year 4+" },
      { title: "Postgraduate", studyYear: "Postgraduate" },
      { title: "On exchange", detail: "Here for a term or a year.", studyYear: "Exchange" },
    ],
  },
  {
    id: "major",
    section: "you",
    eyebrow: "About you",
    title: "What are you studying?",
    hint: "A few words is plenty — it goes next to your university on your profile.",
    kind: "text",
    factor: "major",
    group: "you",
    placeholder: "e.g. Sociology",
    maxLength: 40,
    options: [],
  },

  // --- how you live (soft, scored) -----------------------------------------
  // The owner's demo boundary is a short questionnaire, so the six soft
  // lifestyle factors are elicited by TWO composite questions instead of six
  // separate ones. Every option still writes concrete 0..1 values for each of
  // its factors, so the matcher's input is unchanged — the comparison is still
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
  {
    id: "cook_at_home",
    section: "bonding",
    eyebrow: "The kitchen",
    title: "How often do you actually cook?",
    hint: "Not scored — but it decides whether the kitchen matters to you.",
    kind: "choice",
    factor: "cook_at_home",
    optional: true,
    options: [
      { title: "Most nights", detail: "The kitchen is the point.", cooks: "every day" },
      { title: "A few times a week", cooks: "often" },
      { title: "Rarely — I'm out, or I order", cooks: "rarely" },
      { title: "Never", detail: "I'll trade kitchen space for a bigger room.", cooks: "never" },
    ],
  },
  {
    id: "about_you_line",
    section: "bonding",
    eyebrow: "In your own words",
    title: "Your line. The one that makes someone message you.",
    hint: "Optional. This is the first thing people see — be a bit shocking.",
    kind: "text",
    factor: "tagline",
    optional: true,
    placeholder: "e.g. I will absolutely judge your rice cooker.",
    maxLength: 90,
    options: [],
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
    group: "gender",
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
    hint: "A hard filter — it decides who you see.",
    kind: "choice",
    factor: "gender_preference",
    group: "gender",
    options: [
      { title: "Anyone", detail: "Getting on matters most.", anyGender: true },
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
    group: "belief",
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
    group: "belief",
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
    hint: "Pick as many as you like. We use your campus to estimate the journey.",
    kind: "multi",
    factor: "target_areas",
    max: 6,
    options: TARGET_AREA_OPTIONS.map((tag) => ({ title: tag, tag })),
  },
  {
    id: "max_commute",
    section: "nonneg",
    eyebrow: "The journey",
    title: "How long is too long to get to campus?",
    hint: "Travel time, not distance — estimated district to district, so it is a guide rather than a journey planner.",
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
    hint: "Your share. We multiply it by everyone moving in to price whole flats.",
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
    id: "roommate_count",
    section: "nonneg",
    eyebrow: "The household",
    title: "How many other people are you happy sharing with?",
    hint: "This sets your household budget — your ceiling times everyone moving in.",
    kind: "choice",
    factor: "roommate_count",
    options: [
      { title: "One other person", detail: "A two-person flat.", roommates: 1 },
      { title: "Two others", roommates: 2 },
      { title: "Three others", roommates: 3 },
      { title: "Four or more", detail: "The more the merrier.", roommates: 4 },
    ],
  },
  {
    id: "flat_size",
    section: "nonneg",
    eyebrow: "Flat size",
    title: "How small is too small — for the whole flat?",
    hint: "A preference, not a filter. We flag homes outside it; we never hide people because of it.",
    kind: "choice",
    factor: "flat_size",
    options: [
      { title: "Any size — I'm flexible", sizeMin: null },
      { title: "At least 400 sq ft", sizeMin: 400 },
      { title: "At least 600 sq ft", sizeMin: 600 },
      { title: "At least 800 sq ft", sizeMin: 800 },
      { title: "At least 1,000 sq ft", sizeMin: 1000 },
    ],
  },
  {
    id: "must_haves",
    section: "nonneg",
    eyebrow: "Must-haves",
    title: "Pick five things the home has to have.",
    hint: "Used to sort the homes you save — not to filter people out.",
    kind: "multi",
    factor: "must_haves",
    max: 5,
    optional: true,
    options: MUST_HAVE_OPTIONS.map((tag) => ({ title: tag, tag })),
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

export type QuizPage = {
  group?: string
  section: QuizSection
  questions: Array<{ question: QuizQuestion; index: number }>
}

/**
 * Questions grouped into pages. Consecutive questions sharing a `group` land on
 * one screen (the two gender questions, the two belief questions); everything
 * else gets a page of its own. Answers are still keyed by the GLOBAL question
 * index, so nothing downstream changes.
 */
export const QUIZ_PAGES: QuizPage[] = (() => {
  const pages: QuizPage[] = []
  QUIZ.forEach((question, index) => {
    const last = pages[pages.length - 1]
    if (
      last &&
      question.group &&
      last.group === question.group &&
      last.section === question.section
    ) {
      last.questions.push({ question, index })
    } else {
      pages.push({
        group: question.group,
        section: question.section,
        questions: [{ question, index }],
      })
    }
  })
  return pages
})()

export type ProfileOptions = {
  /** From the verified institution — the anchor for every journey estimate. */
  campusDistrict?: string | null
}

/**
 * Turn the raw answers into a Profile the matcher understands.
 * Single-select questions contribute one index; multi-select questions
 * contribute an array of indices; text questions contribute a string.
 */
export function answersToProfile(
  answers: Answer[],
  options: ProfileOptions = {},
): Profile {
  const about_me: Record<string, number> = {}
  const looking_for: NonNullable<Profile["looking_for"]> = {}
  const letters: Record<string, string> = {}
  const multi: Record<string, string[]> = {}
  const picked: Record<string, QuizOption> = {}
  let tagline: string | null = null
  let major: string | null = null
  let cooks: Profile["cooks_at_home"] = null
  let roommates: number | null = null

  QUIZ.forEach((q, i) => {
    const choice = answers[i]
    if (choice === undefined) return

    if (q.kind === "text") {
      if (typeof choice === "string" && choice.trim()) {
        const value = choice.trim().slice(0, q.maxLength ?? 90)
        // Two free-text questions exist, and they are not interchangeable:
        // `tagline` is the icebreaker line, `major` is a profile field.
        if (q.factor === "major") major = value
        else tagline = value
      }
      return
    }

    const indices = Array.isArray(choice)
      ? choice
      : typeof choice === "number"
        ? [choice]
        : []
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
    if (option.cooks) cooks = option.cooks
    if (typeof option.roommates === "number") roommates = option.roommates
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

  // Flat size is a PREFERENCE now, not a gate (owner, 14 Oct). Recorded so the
  // UI can warn when a suggested home is out of range; never used to hide
  // anyone.
  const size = picked.flat_size
  if (size) looking_for.flat_size_min = size.sizeMin ?? null

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
    flat_size: null,
    household_size: roommates === null ? null : roommates + 1,
    must_haves: multi.must_haves ?? [],
    cooks_at_home: cooks,
    tagline,
    study_year: picked.study_year?.studyYear ?? null,
    major,
    interests: multi.interests ?? [],
  }
}

/** The questions in one section, in order — used by the progress UI. */
export function sectionOf(index: number): QuizSection {
  return QUIZ[index]?.section ?? "lifestyle"
}

/**
 * The inverse of `answersToProfile`, as far as it can be.
 *
 * WHY IT IS NEEDED: "Edit my answers" and signing back in both have to open the
 * quiz with your existing choices already ticked. Until 14 Oct (second pass) the
 * answers array only existed in React state, so it was populated by taking the
 * quiz in this session and blank otherwise — meaning a returning user was
 * silently shown twenty empty questions and their old profile was one "Continue"
 * away from being overwritten. This reconstructs the ticks from the saved
 * profile instead.
 *
 * IT IS DELIBERATELY BEST-EFFORT. Anything it cannot recognise comes back
 * `undefined`, and the quiz renders that question as unanswered. Guessing would
 * be worse than a blank: pre-selecting an option the user never chose is a lie
 * they might not notice before saving.
 */
export function answersFromProfile(profile: Profile): Answer[] {
  const answers: Answer[] = Array(QUIZ.length).fill(undefined)
  const looking = profile.looking_for ?? {}
  const aboutMe = profile.about_me ?? {}
  const multiSource: Record<string, string[] | null | undefined> = {
    target_areas: profile.target_areas,
    interests: profile.interests,
    must_haves: profile.must_haves,
  }

  QUIZ.forEach((question, index) => {
    // Free text.
    if (question.kind === "text") {
      if (question.factor === "major") answers[index] = profile.major ?? undefined
      else if (question.factor === "tagline") {
        answers[index] = profile.tagline ?? undefined
      }
      return
    }

    // Multi-select: match the option's tag against the stored array.
    if (question.kind === "multi") {
      const wanted = multiSource[question.factor]
      if (!wanted?.length) return
      const picked = question.options
        .map((option, optionIndex) => ({ option, optionIndex }))
        .filter(({ option }) => option.tag !== undefined && wanted.includes(option.tag))
        .map(({ optionIndex }) => optionIndex)
      if (picked.length) answers[index] = picked
      return
    }

    // MBTI: the stored type is four letters; this question owns one axis.
    if (question.kind === "mbti") {
      const type = profile.mbti_type
      if (!type || type.length !== 4) return
      const axis = question.factor.replace("mbti_", "")
      // The factor is named in the order the option writes it (`mbti_EI`), while
      // lib/matching.ts validates against the alphabetical pair ("IE"). Getting
      // this list wrong returned -1 and silently left both type questions blank
      // for every returning user — caught by `npm run smoke`, not by tsc.
      const position = ["EI", "SN", "TF", "JP"].indexOf(axis)
      if (position === -1) return
      const letter = type[position].toUpperCase()
      const match = question.options.findIndex(
        (option) => option.letter === letter || option.letters?.[question.factor] === letter,
      )
      if (match !== -1) answers[index] = match
      return
    }

    // The belief requirement is a two-option boolean pair — "no, I don't
    // filter on it" vs "yes, they must share mine" — and `answersToProfile`
    // always resolves it to one of the two, so it is matched positionally.
    if (question.factor === "belief_preference") {
      answers[index] = looking.any_belief === true ? 0 : 1
      return
    }

    // Choice questions carry their meaning on the option payload, so each one is
    // matched against the field it writes rather than against the label text.
    const matches = (option: QuizOption): boolean => {
      switch (question.factor) {
        case "study_year":
          return Boolean(option.studyYear) && option.studyYear === profile.study_year
        case "gender_identity":
          return Boolean(option.identity) && option.identity === profile.gender_identity
        case "gender_preference": {
          if (looking.any_gender === true) return option.anyGender === true
          const theirs = option.categories
          if (!theirs) return false
          return theirs.join() === (looking.roommate_gender_categories ?? []).join()
        }
        case "belief_system":
          return Boolean(option.belief) && option.belief === profile.belief_system
        case "max_commute":
          return (option.minutes ?? null) === (looking.max_commute_minutes ?? null)
        case "budget":
          return (
            (option.budgetMin ?? null) === (profile.budget_min ?? null) &&
            (option.budgetMax ?? null) === (profile.budget_max ?? null)
          )
        case "roommate_count":
          return (
            option.roommates !== undefined &&
            profile.household_size !== null &&
            profile.household_size !== undefined &&
            option.roommates + 1 === profile.household_size
          )
        case "flat_size":
          return (option.sizeMin ?? null) === (looking.flat_size_min ?? null)
        case "smoking":
          return Boolean(option.smoking) && option.smoking === looking.smoking_rule
        case "cook_at_home":
          return Boolean(option.cooks) && option.cooks === profile.cooks_at_home
        default:
          return false
      }
    }

    // A plain scale writes `value`; a composite writes one entry per factor.
    const scaleMatch = (option: QuizOption): boolean => {
      const target = aboutMe[question.factor]
      if (typeof target !== "number") return false
      if (typeof option.value === "number") return option.value === target
      return option.values?.[question.factor] === target
    }

    const found = question.options.findIndex((option) => {
      if (question.kind === "scale") return scaleMatch(option)
      return matches(option)
    })
    if (found !== -1) answers[index] = found
  })

  return answers
}
