// HARDCODED "AI neighbourhood guide" demo content.
//
// In production this is a cited-RAG neighbourhood guide grounded on HK community
// sources (reddit / LIHKG / 連登, student forums) — the "choose an area by its
// vibe and reputation" intro chat in IP.rentmate.transparency. Real AI was turned
// OFF for reliability, so this is a pre-written, per-district vibe + community
// reputation — labelled "AI · demo" in the UI. Vibes are anchored to real
// district character and the Sep-2026 market research; they are NOT scraped from
// any forum in this demo.

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
  "Sai Ying Pun": {
    vibe: "Dense, walkable, full of cafés and the westward extension of the HKU belt; steep streets, good food.",
    communityReputation: "Popular with HKU students who want to be near campus and out; crowded and pricey.",
  },
  "Kennedy Town": {
    vibe: "The western end of the Island line — beach access, a slower pace, strong local food strip.",
    communityReputation: "Chosen by people who want a 'real' neighbourhood at a slightly longer commute.",
  },
  "Hung Hom": {
    vibe: "A transport interchange (MTR + rail to the mainland), sudden new supply, good connectivity.",
    communityReputation: "Noted for convenience and range; less 'student identity' than the older campus pockets.",
  },
  "Ho Man Tin": {
    vibe: "Hilltop, newer estates, quick to both Kowloon Tong and Hung Hom; the trade-off is the walk up.",
    communityReputation: "Seen as a quiet, well-connected compromise between the two.",
  },
}

export function areaGuideFor(area: string): AreaGuide | null {
  return AREA_GUIDES[area] ?? null
}
