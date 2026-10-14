// The candidate pool(s).
//
// TWO POOLS, ONE SHAPE:
//   CANDIDATES    the generic synthetic pool — everyone who signs in sees these.
//   CURATED_CAST  the interactive demo cast: concrete likes, a place story, and
//                 cached replies for every reaction. Reached only through a
//                 demo/admin email (see isCuratedEmail), so the *main screen*
//                 has people you can actually talk to without shipping a fake
//                 user base to real students.
//
// HONESTY NOTE, because this matters: nobody here is real. The districts and the
// *kinds* of places in the place stories are real Hong Kong things; the specific
// anecdotes were written for this demo. Nothing below is a real student, a real
// listing, or a real quotation.
//
// The score is NOT stored here. It is computed at match time from these profiles
// and the signed-in student's own answers, so every number on screen is a real
// output of CP.calculate_match.v2 rather than decoration.

import type { Profile } from "./matching"

export type Candidate = {
  id: string
  name: string
  school: string
  area: string
  budget: string
  image: string
  profile: Profile
  /** Short human line under the name. Curated cast only. */
  tagline?: string
  /** Concrete things they're into. Drives the shared-interest hook. */
  likes?: string[]
  /** A story about the area they want to live in. Curated cast only. */
  place_story?: { area: string; headline: string; story: string }
  /** Cached replies keyed by reaction. Falls back to generated replies. */
  replies?: Partial<Record<"wait" | "same" | "more", string>>
  /** A conversation that already exists, so Messages is not empty on arrival. */
  thread?: Array<{ from: "them" | "me"; text: string; time: string }>
  /** True when this is a real, persisted user rather than a synthetic profile. */
  real?: boolean
  /** The other party's email (real only). */
  email?: string
  /** Stable conversation id for the email pair (real only). */
  conversationId?: string
}

const img = (id: string) =>
  `https://images.unsplash.com/${id}?crop=faces&fit=crop&fm=jpg&q=85&w=400&h=400`

/** Rent figures as numbers, so the hard budget gate has something to compare. */
const rent = (min: number, max: number) => ({ budget_min: min, budget_max: max })

// --- the generic pool --------------------------------------------------------
// Deliberately plain: no stories, no seeded threads, few likes. These are the
// profiles a normal sign-in sees, and they are scored by the same contract.

export const CANDIDATES: Candidate[] = [
  {
    id: "c1",
    name: "Michelle Ho",
    school: "CUHK · Year 2",
    area: "Sha Tin",
    budget: "$6.5–8K",
    image: img("photo-1688354807300-449aba9c78cb"),
    likes: ["milk tea, less sugar", "Sunday hikes", "cooking at home"],
    profile: {
      gender_identity: "woman",
      belief_system: "no religion",
      mbti_type: "ISFJ",
      area: "Sha Tin",
      target_areas: ["Sha Tin", "Tai Wai"],
      room_size: 90,
      ...rent(6500, 8000),
      about_me: {
        sleep_schedule: 0.33, shared_space_habits: 0.33, social_guest_preference: 0.33,
        noise_preference: 0.33, personal_space_preference: 0.33, bill_splitting_style: 0.33,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "c2",
    name: "Ryan Liu",
    school: "HKBU · Year 3",
    area: "Kowloon Tong",
    budget: "$7–9K",
    image: img("photo-1660412625493-0c8266edddb8"),
    likes: ["board games", "bouldering", "film photography"],
    profile: {
      gender_identity: "man",
      belief_system: "christianity",
      mbti_type: "INTJ",
      area: "Kowloon Tong",
      target_areas: ["Kowloon Tong", "Ho Man Tin"],
      room_size: 100,
      ...rent(7000, 9000),
      about_me: {
        sleep_schedule: 0.33, shared_space_habits: 0, social_guest_preference: 0.33,
        noise_preference: 0.33, personal_space_preference: 0, bill_splitting_style: 0.33,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "c3",
    name: "Natalie Chow",
    school: "HKU · Year 2",
    area: "Kennedy Town",
    budget: "$8–10K",
    image: img("photo-1688354805578-af85ea68127d"),
    likes: ["indie gigs", "night markets", "vintage markets"],
    profile: {
      gender_identity: "woman",
      belief_system: "no religion",
      mbti_type: "ENFP",
      area: "Kennedy Town",
      target_areas: ["Kennedy Town", "Sai Ying Pun"],
      room_size: 110,
      ...rent(8000, 10000),
      about_me: {
        sleep_schedule: 0.67, shared_space_habits: 0.67, social_guest_preference: 0.67,
        noise_preference: 0.67, personal_space_preference: 0.67, bill_splitting_style: 0.33,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "c4",
    name: "Avery Lam",
    school: "PolyU · Year 3",
    area: "Hung Hom",
    budget: "$6–8K",
    image: img("photo-1621274790572-7c32596bc67f"),
    likes: ["bouldering", "swimming", "cooking at home"],
    profile: {
      gender_identity: "nonbinary",
      belief_system: "buddhism",
      mbti_type: "ISTP",
      area: "Hung Hom",
      target_areas: ["Hung Hom", "Ho Man Tin"],
      room_size: 80,
      ...rent(6000, 8000),
      about_me: {
        sleep_schedule: 0, shared_space_habits: 0.33, social_guest_preference: 0.33,
        noise_preference: 0, personal_space_preference: 0.33, bill_splitting_style: 0.33,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "c5",
    name: "Jason Tang",
    school: "CityU · Year 2",
    area: "Kowloon Tong",
    budget: "$7–9K",
    image: img("photo-1544168190-79c17527004f"),
    likes: ["badminton", "board games", "street-food hunts"],
    profile: {
      gender_identity: "man",
      belief_system: "no religion",
      mbti_type: "ESTJ",
      area: "Kowloon Tong",
      target_areas: ["Kowloon Tong", "Sham Shui Po"],
      room_size: 95,
      ...rent(7000, 9000),
      about_me: {
        sleep_schedule: 0.33, shared_space_habits: 0.33, social_guest_preference: 0.67,
        noise_preference: 0.67, personal_space_preference: 0.67, bill_splitting_style: 0,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "c6",
    name: "Sophie Leung",
    school: "HKUST · Year 2",
    area: "Tseung Kwan O",
    budget: "$6.5–8.5K",
    image: img("photo-1607529379169-5804750c1f9a"),
    likes: ["K-pop", "film photography", "milk tea, less sugar"],
    profile: {
      gender_identity: "woman",
      belief_system: "christianity",
      mbti_type: "INFP",
      area: "Tseung Kwan O",
      target_areas: ["Tseung Kwan O", "North Point"],
      room_size: 85,
      ...rent(6500, 8500),
      about_me: {
        sleep_schedule: 0.67, shared_space_habits: 0.33, social_guest_preference: 0,
        noise_preference: 0, personal_space_preference: 0.33, bill_splitting_style: 0.33,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    // The one smoker in the pool, on purpose: a non-smoking requirement visibly
    // prunes him, which is the clearest way to show the hard gate doing work.
    id: "c7",
    name: "Marcus Yip",
    school: "EdUHK · Year 4",
    area: "Tai Po",
    budget: "$5.5–7K",
    image: img("photo-1565016941625-2bee25d37f72"),
    likes: ["night markets", "street-food hunts", "swimming"],
    profile: {
      gender_identity: "man",
      belief_system: "no religion",
      mbti_type: "ESFP",
      area: "Tai Po",
      target_areas: ["Tai Po", "Fo Tan"],
      room_size: 70,
      ...rent(5500, 7000),
      about_me: {
        sleep_schedule: 1, shared_space_habits: 0.67, social_guest_preference: 1,
        noise_preference: 0.67, personal_space_preference: 1, bill_splitting_style: 0.67,
        smoking_status: 0,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "c8",
    name: "Chloe Wong",
    school: "Lingnan · Year 3",
    area: "Tuen Mun",
    budget: "$5–7K",
    image: img("photo-1619431667975-e93b820cde63"),
    likes: ["second-hand bookshops", "cooking at home", "Sunday hikes"],
    profile: {
      gender_identity: "woman",
      belief_system: "no religion",
      mbti_type: "ISFP",
      area: "Tuen Mun",
      target_areas: ["Tuen Mun"],
      room_size: 65,
      ...rent(5000, 7000),
      about_me: {
        sleep_schedule: 0.33, shared_space_habits: 0.33, social_guest_preference: 0.33,
        noise_preference: 0.33, personal_space_preference: 0.67, bill_splitting_style: 0.33,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "c9",
    name: "Ethan Chan",
    school: "HKU · Year 1",
    area: "Sai Ying Pun",
    budget: "$8–10K",
    image: img("photo-1657830638749-aa27415f9a43"),
    likes: ["indie gigs", "badminton", "vintage markets"],
    profile: {
      gender_identity: "man",
      belief_system: "no religion",
      mbti_type: "ENTP",
      area: "Sai Ying Pun",
      target_areas: ["Sai Ying Pun", "Kennedy Town"],
      room_size: 120,
      ...rent(8000, 10000),
      about_me: {
        sleep_schedule: 1, shared_space_habits: 0.67, social_guest_preference: 0.67,
        noise_preference: 0.67, personal_space_preference: 0.67, bill_splitting_style: 0.67,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "c10",
    name: "Yuki Lau",
    school: "CUHK · Year 4",
    area: "Tai Wai",
    budget: "$6–8K",
    image: img("photo-1657155275125-4ce23e9cec63"),
    likes: ["24-hour cha chaan teng", "board games", "film photography"],
    profile: {
      gender_identity: "woman",
      belief_system: "buddhism",
      mbti_type: "INFJ",
      area: "Tai Wai",
      target_areas: ["Tai Wai", "Sha Tin"],
      room_size: 90,
      ...rent(6000, 8000),
      about_me: {
        sleep_schedule: 0.33, shared_space_habits: 0.33, social_guest_preference: 0.67,
        noise_preference: 0.33, personal_space_preference: 0.33, bill_splitting_style: 0.33,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
]

// --- the curated cast --------------------------------------------------------
// Six students you can actually have a conversation with. Every one of them is
// anchored to a real CUHK-side district, so the demo's campus anchor (Sha Tin)
// produces a live commute estimate on the card.

export const CURATED_CAST: Candidate[] = [
  {
    id: "m1",
    name: "Michelle Ho",
    school: "CUHK · Year 2 · Sociology",
    area: "Sha Tin",
    budget: "$6.5–8K",
    tagline: "Two years in Sha Tin and still finding new noodle places.",
    image: img("photo-1688354807300-449aba9c78cb"),
    likes: ["24-hour cha chaan teng", "milk tea, less sugar", "Sunday hikes", "cooking at home"],
    place_story: {
      area: "Sha Tin",
      headline: "Michelle says the reason to live in Sha Tin is breakfast, not the MTR.",
      story:
        "Everyone picks Sha Tin for the station. The thing I'd actually tell you is the wet market on the ground floor of the estate — the little breakfast stall does a bowl of congee and a fried dough stick for about twenty dollars, and it opens at half six. I've been there before lectures more times than I'd admit. If you move here and you're not a breakfast person, you will be.",
    },
    replies: {
      wait: "Right?! Nobody mentions it because it's not on any list. Twenty dollars, and it's better than anything on the station side. Are you a breakfast person or a coffee-on-the-way person?",
      same: "Okay good, because I've had flatmates who never left their room and it's honestly lonely. What does your normal week look like?",
      more: "Honestly? Sha Tin is a good deal if you look past the obvious blocks. The estates on the hill side are quieter and about ten minutes further from the station, and that ten minutes knocks a fair bit off the rent. I'd start there.",
    },
    profile: {
      gender_identity: "woman",
      belief_system: "no religion",
      mbti_type: "ISFJ",
      area: "Sha Tin",
      target_areas: ["Sha Tin", "Tai Wai"],
      room_size: 90,
      ...rent(6500, 8000),
      about_me: {
        sleep_schedule: 0.33, shared_space_habits: 0.33, social_guest_preference: 0.33,
        noise_preference: 0.33, personal_space_preference: 0.33, bill_splitting_style: 0.33,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "m2",
    name: "Priya Raman",
    school: "CUHK · Year 3 · Journalism",
    area: "Tai Wai",
    budget: "$6–8K",
    tagline: "Photographs the same three streets until they stop being boring.",
    image: img("photo-1494790108377-be9c29b29330"),
    likes: ["street-food hunts", "night markets", "film photography", "24-hour cha chaan teng"],
    place_story: {
      area: "Tai Wai",
      headline: "Priya knows a Tai Wai dai pai dong that only opens after nine.",
      story:
        "There's a stretch behind the market in Tai Wai where the stalls set up after nine at night — proper open-air tables, plastic stools, the whole thing. Nobody in my year believes me until I take them. It's twenty minutes' walk from the station and it's the only reason I'd argue Tai Wai over Sha Tin. That and the rent, which is genuinely lower for the same size.",
    },
    replies: {
      wait: "I know! It's not signed, it's not on any app, you just have to know someone. I'll take you if we end up living near each other — that's a real offer.",
      same: "Good, because I need someone who'll actually come out at 10pm instead of saying they're tired. What's your usual weeknight?",
      more: "Tai Wai is the honest answer for CUHK. You're one stop out, you keep the same line, and you pay noticeably less. The trade-off is there's less to do on your own doorstep — which is fine if you're the type to go find it.",
    },
    profile: {
      gender_identity: "woman",
      belief_system: "hinduism",
      mbti_type: "ENFP",
      area: "Tai Wai",
      target_areas: ["Tai Wai", "Sha Tin"],
      room_size: 80,
      ...rent(6000, 8000),
      about_me: {
        sleep_schedule: 0.67, shared_space_habits: 0.67, social_guest_preference: 0.67,
        noise_preference: 0.67, personal_space_preference: 0.67, bill_splitting_style: 0.67,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "m3",
    name: "Ka Ming Cheung",
    school: "CUHK · Year 4 · Engineering",
    area: "Ma On Shan",
    budget: "$5.5–7K",
    tagline: "Runs the promenade at six, climbs on Thursdays.",
    image: img("photo-1500648767791-00dcc994a43e"),
    likes: ["bouldering", "badminton", "swimming", "cooking at home"],
    place_story: {
      area: "Ma On Shan",
      headline: "Ka Ming picked Ma On Shan for the promenade, not the flat.",
      story:
        "Ma On Shan gets written off as far, and it is — but the promenade runs the whole length of the water and it's the best running route anywhere near CUHK. I do it at six before anything's open. The flats along there are newer than Sha Tin's and cheaper per square foot, because everyone's fixated on being next to a station. Two stops on the bus to the campus, and I've never once been late.",
    },
    replies: {
      wait: "Yeah — it's the thing I'd miss most if I moved. You'd be surprised how few people actually use it. Do you run?",
      same: "Nice. Do you climb too, or is that just me? I'm at the gym in Fo Tan most Thursdays.",
      more: "If you're at CUHK, Ma On Shan is the value play. You get more space for the same money and you're on the bus line. The catch is the last bus, so if you're out late in Kowloon it's a taxi.",
    },
    profile: {
      gender_identity: "man",
      belief_system: "no religion",
      mbti_type: "ISTJ",
      area: "Ma On Shan",
      target_areas: ["Ma On Shan", "Sha Tin"],
      room_size: 110,
      ...rent(5500, 7000),
      about_me: {
        sleep_schedule: 0, shared_space_habits: 0, social_guest_preference: 0.33,
        noise_preference: 0, personal_space_preference: 0.33, bill_splitting_style: 0,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "m4",
    name: "Sofia Ibanez",
    school: "CUHK · Exchange, Year 3",
    area: "Sha Tin",
    budget: "$7–9K",
    tagline: "Here for a year, determined not to spend it in a dorm.",
    image: img("photo-1534528741775-53994a69daeb"),
    likes: ["K-pop", "indie gigs", "vintage markets", "film photography"],
    place_story: {
      area: "Sha Tin",
      headline: "Sofia found a record shop above a noodle place and hasn't shut up about it.",
      story:
        "Second floor of a building near the station, above a noodle shop — you go up a staircase that looks like it leads nowhere and there's a whole floor of vinyl, mostly Cantopop from the eighties and nineties. The owner picks something for you if you stand there long enough. I went in for twenty minutes and left two hours later with three records and no plan for the afternoon.",
    },
    replies: {
      wait: "It's real! I'll send you the street. You have to go up the stairs though, if you take the lift you end up in the wrong building entirely.",
      same: "Okay we're going to get along. Are you going to any of the shows this month?",
      more: "Sha Tin is honestly fine for one year. Everything's on one line, and the exchange crowd is small enough that you'll know everyone by week three. The trick is not to eat at the same place twice in the first month.",
    },
    profile: {
      gender_identity: "woman",
      belief_system: "christianity",
      mbti_type: "ESFP",
      area: "Sha Tin",
      target_areas: ["Sha Tin", "Tai Wai"],
      room_size: 95,
      ...rent(7000, 9000),
      about_me: {
        sleep_schedule: 0.67, shared_space_habits: 0.67, social_guest_preference: 1,
        noise_preference: 0.67, personal_space_preference: 0.67, bill_splitting_style: 0.67,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "m5",
    name: "Daniel Ng",
    school: "CUHK · Year 2 · Architecture",
    area: "Fo Tan",
    budget: "$6–7.5K",
    tagline: "Lives above a studio and can explain why the rent is strange.",
    image: img("photo-1507003211169-0a1dd7228f2d"),
    likes: ["board games", "chicken McNuggets at 2am", "swimming", "bouldering"],
    place_story: {
      area: "Fo Tan",
      headline: "Daniel says Fo Tan is the cheapest place near CUHK that nobody checks.",
      story:
        "Fo Tan is all industrial buildings, and a few of them have been converted into studios and flats. Because nobody thinks of it as residential, the rent is well below what you'd pay two stops over. Downside is real: there's no supermarket, the last bus is early, and on a Sunday it's dead quiet. I like that. If you need a coffee shop downstairs, you'll hate it.",
    },
    replies: {
      wait: "Genuinely — the trick is the converted buildings. You have to ask around, they don't list them. What's your budget looking like?",
      same: "That's the whole reason I'm here. There's a board game café in Sha Tin we could go to before deciding anything.",
      more: "Fo Tan suits me because I'm in the studio most nights anyway. If you're someone who needs to be near shops and food, it's the wrong call and I'd rather say so now than have you move in and resent it.",
    },
    profile: {
      gender_identity: "man",
      belief_system: "no religion",
      mbti_type: "INTP",
      area: "Fo Tan",
      target_areas: ["Fo Tan", "Sha Tin"],
      room_size: 100,
      ...rent(6000, 7500),
      about_me: {
        sleep_schedule: 1, shared_space_habits: 0.67, social_guest_preference: 0.33,
        noise_preference: 0.33, personal_space_preference: 0.67, bill_splitting_style: 0.33,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
  },
  {
    id: "m6",
    name: "Wing Yan Tsang",
    school: "CUHK · Year 3 · Chinese Literature",
    area: "Sha Tin",
    budget: "$6.5–8.5K",
    tagline: "Cooks properly, reads too much, in bed by eleven.",
    image: img("photo-1438761681033-6461ffad8d80"),
    likes: ["second-hand bookshops", "cooking at home", "Sunday hikes", "24-hour cha chaan teng"],
    place_story: {
      area: "Sha Tin",
      headline: "Wing Yan found a second-hand bookshop in an arcade and it became her flat's third room.",
      story:
        "It's in one of the older arcades, up an escalator, behind a phone-repair place. The whole shop is maybe two metres wide and it's stacked to the ceiling. The owner sells by weight for the older stuff. I go in 'for one book' and come out with six, which is why my flatmate and I agreed on a shelf limit before we moved in together. You learn to negotiate the small things.",
    },
    replies: {
      wait: "It's tiny — you'll walk past it twice. Go up the escalator behind the phone place. And don't go in with a budget.",
      same: "Then we should talk about the kitchen, because that's where flatmates actually fall out. Do you cook properly or is it instant noodles?",
      more: "I've lived in Sha Tin three years. The honest advice is to agree the small things in writing before you sign — bills, guests, cleaning. It sounds joyless and it saves the friendship.",
    },
    profile: {
      gender_identity: "woman",
      belief_system: "buddhism",
      mbti_type: "INFJ",
      area: "Sha Tin",
      target_areas: ["Sha Tin", "Tai Wai"],
      room_size: 85,
      ...rent(6500, 8500),
      about_me: {
        sleep_schedule: 0.33, shared_space_habits: 0.33, social_guest_preference: 0.33,
        noise_preference: 0.33, personal_space_preference: 0.33, bill_splitting_style: 0.33,
        smoking_status: 1,
      },
      looking_for: { any_gender: true },
    },
    thread: [
      {
        from: "them",
        text: "Hi! You came up as a strong match — we both keep the flat quiet and split costs the boring way. That's exactly what I want.",
        time: "10:24",
      },
      {
        from: "me",
        text: "Honestly the boring way is the right way. Are you already looking in Sha Tin?",
        time: "10:31",
      },
      {
        from: "them",
        text: "Since August. I've got two viewings this week — want me to send you what I find?",
        time: "10:34",
      },
    ],
  },
]

// --- the admin gate ----------------------------------------------------------

/** The sign-in that unlocks the curated cast. A demo address, not a real one. */
export const DEMO_EMAIL = "demo@cuhk.edu.hk"

/**
 * True for the demo/admin local part. Deliberately narrow: a normal student
 * address never lands here, so the curated cast is not something real users see.
 */
export function isCuratedEmail(email: string): boolean {
  const local = (email.split("@")[0] ?? "").trim().toLowerCase()
  return local === "demo" || local === "admin"
}

export function poolFor(email: string): Candidate[] {
  return isCuratedEmail(email) ? CURATED_CAST : CANDIDATES
}

/**
 * True only for the `admin@` local part. Gates the moderation review queue:
 * a report should be visible to the people expected to act on it, and to
 * nobody else. Deliberately narrower than `isCuratedEmail` — `demo@` is a
 * walkthrough account, not a moderator.
 */
export function isAdminEmail(email: string): boolean {
  return (email.split("@")[0] ?? "").trim().toLowerCase() === "admin"
}
