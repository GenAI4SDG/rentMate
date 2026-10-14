// HARDCODED "AI neighbourhood guide" demo content.
//
// In production this is a cited-RAG neighbourhood guide grounded on HK community
// sources (reddit / LIHKG / 連登, student forums) — the "choose an area by its
// vibe and reputation" intro chat in IP.rentmate.transparency. Real AI was turned
// OFF for reliability, so this is a pre-written, per-district vibe + community
// reputation — labelled "AI · demo" in the UI. Vibes are anchored to real
// district character and the Sep-2026 market research; they are NOT scraped from
// any forum in this demo.
//
// WHERE THIS IS SHOWN (updated 14 Oct, second pass): two places, and they are
// the same text on purpose —
//   1. the quiz "Which areas would you actually consider?" question, where the
//      guide appears as you tick a district (the IP's own framing: choose an
//      area by its vibe, not just by its rent), and
//   2. the Homes district step, where you commit to one.
// EVERY selectable district has an entry. `TARGET_AREA_OPTIONS` is the 17 keys
// of DISTRICT_COORDS in lib/matching.ts, and a district with no guide would
// render as a silent card — so `areaGuideFor` returning null is a bug, not a
// state the UI should have to style.

// `area` is not a field: the record key IS the district, so there is exactly one
// place to spell it (no chance of the key and the label disagreeing).
export type AreaGuide = {
  vibe: string
  communityReputation: string
}

export const AREA_GUIDES: Record<string, AreaGuide> = {
  "Sha Tin": {
    vibe: "Campus-adjacent and practical; one MTR line to CUHK, estate food and a huge new-town grid. Least exciting, most liveable.",
    communityReputation: "Students rate it high on value and food, low on nightlife. Rents here are among the fastest-rising in campus belts.",
  },
  "Tai Wai": {
    vibe: "One stop quieter than Sha Tin for noticeably less rent; a night market stretch that locals actually use.",
    communityReputation: "Common 'insider' pick for CUHK students who want space over scene.",
  },
  "Fo Tan": {
    vibe: "Converted industrial studios, cheapest near CUHK for the space; dead quiet and the last bus is early.",
    communityReputation: "A running joke that it's 'too far' — the counter is that converted buildings rarely list and rent well below two stops over.",
  },
  "Ma On Shan": {
    vibe: "A whole-length waterfront promenade, newer cheaper flats, a bus rather than MTR to campus.",
    communityReputation: "Students call it 'far but the value play' — more space per dollar if you can live with the last-bus caveat.",
  },
  "Kowloon Tong": {
    vibe: "Green, quiet, well-served by MTR; a long-standing study pocket rather than a social one.",
    communityReputation: "Rated for calm and convenience; one of the campus-belt districts where rent rises fastest.",
  },
  "Ho Man Tin": {
    vibe: "Hilltop, newer estates, quick to both Kowloon Tong and Hung Hom; the trade-off is the walk up.",
    communityReputation: "Seen as a quiet, well-connected compromise between the two.",
  },
  "Hung Hom": {
    vibe: "A transport interchange (MTR + rail to the mainland), sudden new supply, good connectivity.",
    communityReputation: "Noted for convenience and range; less 'student identity' than the older campus pockets.",
  },
  "Mong Kok": {
    vibe: "The densest thing on the map — shopping streets, food at every hour, and a flat above all of it if you can sleep through it.",
    communityReputation: "The trade everyone makes knowingly: unbeatable convenience, worst noise and smallest flats per dollar.",
  },
  "Yau Ma Tei": {
    vibe: "Mong Kok's older, cheaper neighbour — fruit market, temple, tong lau walk-ups, everything within a few blocks.",
    communityReputation: "Popular with people who want the Kowloon convenience without the Mong Kok premium.",
  },
  "Sham Shui Po": {
    vibe: "The cheapest of the Kowloon core: electronics streets, fabric market, very good cheap food, older buildings.",
    communityReputation: "Students rate the food and the price; the honest caveat is building condition — view in person, always.",
  },
  "Sai Ying Pun": {
    vibe: "Dense, walkable, full of cafés and the westward extension of the HKU belt; steep streets, good food.",
    communityReputation: "Popular with HKU students who want to be near campus and out; crowded and pricey.",
  },
  "Kennedy Town": {
    vibe: "The western end of the Island line — beach access, a slower pace, strong local food strip.",
    communityReputation: "Chosen by people who want a 'real' neighbourhood at a slightly longer commute.",
  },
  "Wan Chai": {
    vibe: "Central-adjacent, mixed old and new, everything open late; the Island line runs straight through it.",
    communityReputation: "Convenience without Central rent — but it is still one of the priciest stops on this list.",
  },
  "North Point": {
    vibe: "East Island, genuinely local: tram terminus, wet market, a lot of long-standing family businesses.",
    communityReputation: "The value pick on the Island line for students who don't need to be central.",
  },
  "Tai Po": {
    vibe: "A market town with a river running through it, quiet streets and the cheapest rents on this list.",
    communityReputation: "The 'I wanted space and a garden' choice — the price is the commute and the last train.",
  },
  "Tseung Kwan O": {
    vibe: "Purpose-built new town on the east side: malls, waterfront, newer buildings, everything planned at once.",
    communityReputation: "Rated for newness and space per dollar; criticised for feeling like a place with no edge to it.",
  },
  "Tuen Mun": {
    vibe: "Far west, its own town with its own rhythms; big estates, and a light-rail network rather than the MTR.",
    communityReputation: "The longest commute and the lowest rent on the board — you are choosing one or the other.",
  },
}

export function areaGuideFor(area: string): AreaGuide | null {
  return AREA_GUIDES[area] ?? null
}

/**
 * Districts with no guide on file.
 *
 * This takes the district list as an argument rather than importing
 * `TARGET_AREA_OPTIONS` from lib/matching.ts, because matching.ts is
 * deliberately import-free so the oracle check can load it directly. It exists
 * for `npm run smoke` to assert the two lists have not drifted apart — the
 * failure mode it guards is a district that is selectable but silent.
 */
export function districtsWithoutGuides(areas: readonly string[]): string[] {
  return areas.filter((area) => !AREA_GUIDES[area])
}
