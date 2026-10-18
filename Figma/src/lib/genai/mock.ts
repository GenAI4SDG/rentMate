import type {
  ChatReply,
  ChatTurn,
  GenAIProvider,
  MatchInput,
  Narrative,
  PlanStep,
  SettlingPlan,
} from "./types"

/* -------------------------------------------------------------------------- */
/* Quiz answers → traits                                                       */
/* Order of questions in App.tsx: 0 home rhythm · 1 social · 2 conflict ·      */
/* 3 routine · 4 colour · 5 kitchen · 6 match preference                       */
/* -------------------------------------------------------------------------- */

type Traits = {
  rhythm: "early" | "late" | "flexible" | "quiet"
  social: "quiet" | "balanced" | "social"
  sharing: "shares" | "separate"
  conflict: "practical" | "caring" | "space" | "direct"
}

export function traitsFromAnswers(a: number[]): Traits {
  const rhythm = (["early", "late", "flexible", "quiet"] as const)[a[3] ?? 2] ?? "flexible"
  const social =
    a[0] === 2 || a[1] === 2
      ? "social"
      : a[0] === 0 || a[1] === 0 || a[1] === 1
        ? "quiet"
        : "balanced"
  const sharing = (a[5] ?? 1) <= 1 ? "shares" : "separate"
  const conflict = (["practical", "caring", "space", "direct"] as const)[a[2] ?? 0] ?? "practical"
  return { rhythm, social, sharing, conflict }
}

const clamp = (n: number) => Math.max(55, Math.min(99, Math.round(n)))

function matchSignals(tags: string[]) {
  const t = tags.join(" | ").toLowerCase()
  return {
    sameSleep: t.includes("same sleep") || t.includes("early riser"),
    earlyRiser: t.includes("early riser"),
    nightOwl: t.includes("night owl"),
    quiet:
      t.includes("quiet") || t.includes("calm shared home"),
    social: t.includes("social") || t.includes("lively"),
    sameEnergy: t.includes("same social energy"),
    shares: t.includes("shared cooking") || t.includes("shared basics"),
    tidy: t.includes("tidy"),
    calm: t.includes("calm communicator"),
    direct: t.includes("direct communicator"),
    flexible: t.includes("flexible"),
  }
}

/* -------------------------------------------------------------------------- */
/* Compatibility narrative (placeholder for the GPT-4o-mini narrative)         */
/* -------------------------------------------------------------------------- */

export function buildNarrative(match: MatchInput, answers: number[]): Narrative {
  const me = traitsFromAnswers(answers)
  const m = matchSignals(match.tags)
  const first = match.name.split(" ")[0]

  const strengths: string[] = []
  const frictions: string[] = []

  // Routine
  let routineBoost = 0
  if (m.sameSleep || (m.flexible && me.rhythm === "flexible")) {
    strengths.push(
      `You and ${first} keep compatible hours — fewer clashes over mornings, noise and bathroom time.`,
    )
    routineBoost = 4
  } else if (m.nightOwl && me.rhythm === "early") {
    frictions.push(
      `${first} is a night owl and you are an early bird — agree quiet hours so late evenings and early alarms do not collide.`,
    )
    routineBoost = -4
  } else if (m.earlyRiser && me.rhythm === "late") {
    frictions.push(
      `${first} wakes early while you work late — decide when the flat needs to be quiet.`,
    )
    routineBoost = -4
  }

  // Social energy
  let commsBoost = 0
  if (m.sameEnergy || (m.quiet && me.social === "quiet") || (m.social && me.social === "social")) {
    strengths.push(
      me.social === "quiet"
        ? `You both value calm evenings at home, so recharging time is respected.`
        : `You both like some energy at home — guests and shared meals should feel natural.`,
    )
    commsBoost = 3
  } else if ((m.quiet && me.social === "social") || (m.social && me.social === "quiet")) {
    frictions.push(
      `Your social energy differs — set expectations early about guests and weekend noise.`,
    )
    commsBoost = -3
  }

  // Communication
  if (m.calm || m.direct) {
    const matchStyle = m.calm ? "calm and considerate" : "direct and clear"
    strengths.push(
      `${first} is ${matchStyle} when things come up, which pairs ${
        me.conflict === "direct" || me.conflict === "practical" ? "well with" : "reasonably with"
      } your preference to ${
        me.conflict === "practical"
          ? "find a practical fix"
          : me.conflict === "caring"
            ? "check in on feelings first"
            : me.conflict === "space"
              ? "take some time before talking"
              : "set clear boundaries"
      }.`,
    )
    if (m.direct && (me.conflict === "space" || me.conflict === "caring")) {
      frictions.push(
        `${first} prefers direct conversations — tell them if you need a little time before talking things through.`,
      )
    }
  }

  // Shared spaces
  let spaceBoost = 0
  if (m.tidy) {
    strengths.push(`${first} keeps shared spaces tidy, which matters when you split a kitchen and bathroom.`)
    spaceBoost = 3
  }
  if (m.shares && me.sharing === "shares") {
    strengths.push(`You are both comfortable sharing basics like oil and cleaning supplies.`)
    spaceBoost += 3
  } else if (m.shares && me.sharing === "separate") {
    frictions.push(
      `${first} likes sharing food basics, you prefer separate supplies — label shelves and agree what is communal.`,
    )
    spaceBoost -= 4
  }

  if (!strengths.length) {
    strengths.push(`Your profiles overlap on everyday habits, which is a solid base for a shared home.`)
  }
  if (!frictions.length) {
    frictions.push(
      `No obvious clash — still agree house rules on guests, bills and cleaning in the first week.`,
    )
  }

  const starters = [
    `What does a perfect weeknight at home look like for you?`,
    me.sharing === "separate"
      ? `How do you feel about labelling food and sharing only household basics?`
      : `Would you rather split groceries or cook together a few nights a week?`,
    `How would you like us to raise it if something at home bothers us?`,
  ]

  const headline =
    match.score >= 90
      ? `${first} looks like a very strong fit.`
      : match.score >= 82
        ? `${first} is a good fit with a few things to align on.`
        : `${first} could work — talk through the differences first.`

  return {
    headline,
    summary: `Based on your lifestyle answers and ${first}'s profile (${match.tags.join(", ")}). Prefers ${match.area}, budget ${match.budget} / month.`,
    strengths: strengths.slice(0, 3),
    frictions: frictions.slice(0, 2),
    starters,
    dimensions: [
      { label: "Daily routine", score: clamp(match.score + routineBoost + 1) },
      { label: "Communication", score: clamp(match.score + commsBoost - 1) },
      { label: "Shared spaces", score: clamp(match.score + spaceBoost - 2) },
    ],
    source: "placeholder",
  }
}

/* -------------------------------------------------------------------------- */
/* Rental assistant (placeholder for the grounded multilingual chatbot)        */
/* -------------------------------------------------------------------------- */

const DISCLAIMER =
  "General information for orientation only — not legal advice. Check with the Rating and Valuation Department, Estate Agents Authority or a solicitor for your case."

type Topic = {
  keys: string[]
  answer: string
  suggestions?: string[]
}

const TOPICS: Topic[] = [
  {
    keys: ["agency fee", "commission", "agent fee", "中介", "佣金", "agent"],
    answer:
      "In Hong Kong, agent commission on a lease is commonly up to half a month's rent from each side, but it is negotiable and depends on the agreement you sign. Owner-direct listings (like those on Rent Mate) avoid it. If you use an agent, check they hold an Estate Agents Authority licence and get the commission terms in writing before you view.",
    suggestions: ["What deposit is normal?", "How do I spot a scam?"],
  },
  {
    keys: ["deposit", "按金", "advance rent", "prepay"],
    answer:
      "A common arrangement is a two-month rent deposit plus one month's rent in advance. The deposit is refundable at the end of the tenancy subject to the condition of the flat. Ask for a written receipt, take dated photos at move-in, and agree an inventory so deductions are not disputed later. Never pay a deposit before you have viewed the flat and seen the tenancy agreement.",
    suggestions: ["What about stamp duty?", "How do I spot a scam?"],
  },
  {
    keys: ["stamp duty", "tenancy agreement", "lease", "contract", "租約", "印花稅", "sign"],
    answer:
      "A tenancy agreement should name the landlord (match the owner on the Land Registry), the rent, deposit, term, break clause and who pays management fees and utilities. Residential leases attract stamp duty, usually split between landlord and tenant — confirm the current rates on the Inland Revenue Department website. Read it fully, never sign a blank form, and keep a signed copy.",
    suggestions: ["Who pays utilities?", "What is a viewing agreement (睇樓紙)?"],
  },
  {
    keys: ["睇樓紙", "viewing agreement", "viewing form", "provisional"],
    answer:
      "A 睇樓紙 is the document an agent asks you to sign when they show you a property. Read which agent is acting for whom, how commission is triggered, and whether it stops you renting the same flat through another agent. Do not sign anything blank, and ask for a copy.",
    suggestions: ["Agency fee?", "How do I spot a scam?"],
  },
  {
    keys: ["scam", "fraud", "fake", "suspicious", "騙", "too cheap", "landlord abroad"],
    answer:
      "Warning signs: the landlord is 'overseas' and cannot show the flat, you are asked to pay a deposit before viewing, the price is far below similar flats, or the website address looks slightly off. Protect yourself: view in person, search the property owner at the Land Registry, pay only to a verifiable account against a signed agreement, and never send cash or gift cards. Report suspected scams to the Police Anti-Scam Helpline 18222.",
    suggestions: ["What deposit is normal?", "What does the Land Registry check do?"],
  },
  {
    keys: ["land registry", "owner", "ownership", "verify landlord"],
    answer:
      "You can search a property at the Land Registry to see who the registered owner is, then ask to see the landlord's HKID to confirm it matches. If someone else is letting, ask for a written authorisation from the owner. It is a small fee and the best single check against fake landlords.",
    suggestions: ["How do I spot a scam?", "What goes in a tenancy agreement?"],
  },
  {
    keys: ["utilities", "electric", "water", "gas", "bills", "management fee", "wifi", "internet", "水電"],
    answer:
      "Usually the tenant pays electricity, water, gas, internet and sometimes the management fee, while the landlord covers rates and government rent — but it varies, so write who pays what into the agreement. Agree with flatmates how to split bills (equal split, or by room) and use one shared account or an app so nobody is chasing payments.",
    suggestions: ["How do roommates split bills?", "What about the deposit?"],
  },
  {
    keys: ["commute", "mtr", "transport", "octopus", "near", "close to campus", "distance"],
    answer:
      "Aim for a flat within about 30–40 minutes of campus door-to-door and within a 10-minute walk of an MTR station. Rough guide: CUHK → Sha Tin / Tai Wai, HKBU & CityU → Kowloon Tong / Mong Kok, PolyU → Hung Hom, HKU → Kennedy Town / Sai Ying Pun, HKUST → Tseung Kwan O / Po Lam. Get an Octopus card on day one — it works on almost all transport.",
    suggestions: ["Best area for CUHK?", "Settling-in checklist"],
  },
  {
    keys: ["cuhk", "sha tin", "tai wai", "chinese university"],
    answer:
      "Near CUHK, Sha Tin and Tai Wai give you the East Rail line to campus and plenty of supermarkets and restaurants. Tai Po is cheaper but a longer ride. Use the map in Find a flat to compare rents — pins show the district median for context.",
  },
  {
    keys: ["hku", "kennedy town", "sai ying pun", "university of hong kong"],
    answer:
      "For HKU, Kennedy Town and Sai Ying Pun are on the MTR Island line and walkable to campus, but rents are higher. Compare against Quarry Bay / Tin Hau for a longer commute with lower prices.",
  },
  {
    keys: ["polyu", "hung hom", "cityu", "kowloon tong", "hkbu"],
    answer:
      "Hung Hom is the easiest for PolyU. For HKBU and CityU, Kowloon Tong is the sweet spot; Mong Kok and Prince Edward are cheaper and well connected.",
  },
  {
    keys: ["roommate", "flatmate", "split", "conflict", "chores", "clean", "rota", "house rules"],
    answer:
      "Settle house rules in the first week: quiet hours, guests, a cleaning rota, how you split bills and food. Put the basics in a shared note. When something bothers you, raise it early, kindly and specifically — Rent Mate's 'conversation starters' on each match are a good way to open it.",
    suggestions: ["How do roommates split bills?", "What is a good first message?"],
  },
  {
    keys: ["bed space", "bedspace", "subdivided", "cubicle", "cage", "illegal"],
    answer:
      "Be cautious with bed-spaces and heavily subdivided units: some are unsafe or unlicensed. Check there is a proper window, a safe exit and clear fire safety, and that the person letting it is the owner or authorised. When in doubt, ask the university housing office.",
  },
  {
    keys: ["settling", "checklist", "arrive", "arrival", "first week", "new to hong kong"],
    answer:
      "Open the Plan tab for a personalised settling-in checklist: Octopus and a local SIM on day one, a student bank account in the first week, viewings with your matches, then the tenancy and utilities in your first month.",
    suggestions: ["How do I spot a scam?", "What deposit is normal?"],
  },
  {
    keys: ["hello", "hi", "hey", "你好", "help"],
    answer:
      "Hi! I'm the Rent Mate assistant. I can explain Hong Kong renting basics — deposits, agency fees, tenancy agreements, scams, utilities, commuting and living with flatmates.",
    suggestions: ["What deposit is normal?", "How do I spot a scam?", "Agency fee?"],
  },
]

const DEFAULT_SUGGESTIONS = [
  "What deposit is normal?",
  "Agency fee?",
  "How do I spot a scam?",
  "Who pays utilities?",
]

export function buildChatReply(message: string): ChatReply {
  const q = message.toLowerCase()
  let best: { topic: Topic; hits: number } | null = null
  for (const topic of TOPICS) {
    const hits = topic.keys.filter((k) => q.includes(k.toLowerCase())).length
    if (hits && (!best || hits > best.hits)) best = { topic, hits }
  }
  if (!best) {
    return {
      text:
        "I'm not sure about that yet. I can help with deposits, agency fees, tenancy agreements, scams, utilities, commuting by area, and living with flatmates. Try one of the questions below.\n\n" +
        DISCLAIMER,
      suggestions: DEFAULT_SUGGESTIONS,
      source: "placeholder",
    }
  }
  return {
    text: `${best.topic.answer}\n\n${DISCLAIMER}`,
    suggestions: best.topic.suggestions ?? DEFAULT_SUGGESTIONS,
    source: "placeholder",
  }
}

/* -------------------------------------------------------------------------- */
/* Settling-in plan                                                            */
/* -------------------------------------------------------------------------- */

export function buildSettlingPlan(answers: number[]): SettlingPlan {
  const me = traitsFromAnswers(answers)

  const steps: PlanStep[] = [
    {
      id: "temp-stay",
      phase: "Before you land",
      title: "Book 1–2 weeks of temporary accommodation",
      detail:
        "Never commit to a flat you have not seen. A short stay near campus gives you time to view properly and avoid deposit pressure.",
    },
    {
      id: "budget",
      phase: "Before you land",
      title: "Set a monthly housing budget",
      detail:
        "Plan for rent + utilities + transport. Typical upfront cost is two months' deposit plus one month's rent in advance.",
    },
    {
      id: "districts",
      phase: "Before you land",
      title:
        me.rhythm === "late"
          ? "Shortlist 2–3 districts with late MTR access and quiet bedrooms"
          : me.rhythm === "early"
            ? "Shortlist 2–3 districts with a short walk to the MTR and campus"
            : "Shortlist 2–3 districts within 40 minutes of campus",
      detail:
        "Use the Find a flat map to compare rents; the price context shows how a listing compares to its area.",
    },
    {
      id: "octopus",
      phase: "First week",
      title: "Get an Octopus card and a local SIM or eSIM",
      detail:
        "Octopus works on MTR, buses, many shops and campus. A local number is needed for most tenancy and bank forms.",
    },
    {
      id: "bank",
      phase: "First week",
      title: "Open a student bank account",
      detail:
        "Bring your passport, visa/ID and university letter. A local account makes paying rent and bills much simpler.",
    },
    {
      id: "chat-matches",
      phase: "First week",
      title: "Message your top matches and compare house rules",
      detail:
        me.sharing === "separate"
          ? "Raise the kitchen early: you prefer separate supplies, so agree labelling and what is communal."
          : "Agree how you will share groceries, cleaning and bills before you commit.",
    },
    {
      id: "meetup",
      phase: "First week",
      title: "Join a flat-viewing meetup with 2–3 matched students",
      detail:
        me.social === "quiet"
          ? "Keep it low-key: a Google Meet first, then a small in-person viewing together."
          : "Make it social: view flats together, then grab a meal to see how you get on.",
    },
    {
      id: "verify-landlord",
      phase: "First month",
      title: "Verify the owner and read the tenancy agreement",
      detail:
        "Check the registered owner at the Land Registry, never pay a deposit before viewing, and make sure deposit, term, break clause and bills are written down.",
    },
    {
      id: "move-in",
      phase: "First month",
      title: "Photograph the flat and agree an inventory on move-in",
      detail:
        "Dated photos of walls, furniture and appliances protect your deposit when you leave.",
    },
    {
      id: "utilities",
      phase: "First month",
      title: "Set up utilities and split bills with flatmates",
      detail:
        "Register electricity, water, gas and internet, and agree a simple way to split them.",
    },
    {
      id: "house-rules",
      phase: "First month",
      title: "Write down your house rules",
      detail:
        me.rhythm === "quiet"
          ? "Put quiet hours first — they matter most to you."
          : me.conflict === "direct" || me.conflict === "practical"
            ? "Keep it short and practical: guests, cleaning, bills, noise."
            : "Agree a kind way to raise issues — check in weekly for the first month.",
    },
  ]

  return {
    summary: `A step-by-step plan for your first month in Hong Kong, tuned to your ${me.rhythm} routine and ${me.social} social style.`,
    steps,
    source: "placeholder",
  }
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                    */
/* -------------------------------------------------------------------------- */

/** Small delay so the UI shows a realistic "thinking" state in the demo. */
const think = (ms = 450) => new Promise((r) => setTimeout(r, ms))

export const mockProvider: GenAIProvider = {
  async narrative(match, answers) {
    await think()
    return buildNarrative(match, answers)
  },
  async chat(_history: ChatTurn[], message) {
    await think(350)
    return buildChatReply(message)
  },
  async settlingPlan(answers) {
    await think()
    return buildSettlingPlan(answers)
  },
}

export type { Narrative }
